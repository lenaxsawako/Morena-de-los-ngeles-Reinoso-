import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { GUARD_METADATA } from '../constants/guard.constants';
import { IdempotencyOptions } from '../decorators/idempotency.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RedisStoreService } from '../services/redis-store.service';
import {
  IdempotencyConflictException,
  IdempotencyKeyMissingException,
} from '../exceptions/security.exception';

/**
 * Idempotency Interceptor — prevents double payments, duplicate mutations, and race abuse
 *
 * Usage:
 *   @Idempotent()
 *   @UseInterceptors(IdempotencyInterceptor)
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(private readonly reflector: Reflector, private readonly store: RedisStoreService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const options = this.reflector.getAllAndOverride<IdempotencyOptions | undefined>(
      GUARD_METADATA.IDEMPOTENCY_OPTIONS,
      [context.getHandler(), context.getClass()],
    );

    if (!options) return next.handle();

    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const response = context.switchToHttp().getResponse<Response>();

    const headerName = options.header ?? 'idempotency-key';
    const idempKey = request.headers[headerName] as string | undefined;

    if (!idempKey) {
      if (!options.optional) throw new IdempotencyKeyMissingException(headerName);
      return next.handle(); // optional — skip idempotency
    }

    const userId = options.scopeByUser !== false ? (request.user?.sub ?? 'anon') : 'global';
    const responseKey = `idmp:res:${userId}:${idempKey}`;
    const lockKey = `idmp:lock:${userId}:${idempKey}`;

    const cached = await this.store.get(responseKey);
    if (cached) {
      const { status, body } = JSON.parse(cached) as { status: number; body: unknown };
      this.logger.debug(`Idempotency replay — key=${idempKey} user=${userId}`);
      response.status(status);
      response.setHeader('Idempotency-Key', idempKey);
      response.setHeader('Idempotency-Replayed', 'true');
      return of(body);
    }

    const lockTtl = options.lockTtlMs ?? 30_000;
    const acquired = await this.store.setnx(lockKey, '1', lockTtl);

    if (!acquired) {
      this.logger.warn(`Idempotency conflict — key=${idempKey} user=${userId} is being processed`);
      throw new IdempotencyConflictException();
    }

    this.logger.debug(`Idempotency new request — key=${idempKey} user=${userId}`);

    const ttl = options.ttlMs ?? 86_400_000; // 24h

    return next.handle().pipe(
      tap(async (body: unknown) => {
        const status = response.statusCode ?? 200;
        await this.store.set(responseKey, JSON.stringify({ status, body }), ttl);
        await this.store.del(lockKey);
        response.setHeader('Idempotency-Key', idempKey);
        this.logger.debug(`Idempotency cached — key=${idempKey} status=${status} ttl=${ttl}ms`);
      }),
      catchError((err: unknown) => {
        return from(this.store.del(lockKey)).pipe(switchMap(() => throwError(() => err)));
      }),
    );
  }
}
