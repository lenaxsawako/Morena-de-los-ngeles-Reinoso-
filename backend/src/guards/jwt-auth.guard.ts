import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RedisStoreService } from '../services/redis-store.service';
import { TokenNotFoundException, InvalidTokenException } from '../exceptions/auth.exception';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private redisStore: RedisStoreService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);

    if (!token) {
      this.logger.warn(`No token provided — ${request.method} ${request.url}`);
      throw new TokenNotFoundException();
    }

    try {
      const payload = this.jwtService.verify(token);
      const revoked = await this.redisStore.get(`revoked:${payload.sub}`);
      if (revoked) {
        this.logger.warn(`Revoked token used: ${payload.sub}`);
        throw new UnauthorizedException('Token revoked');
      }
      (request as any).user = { userId: payload.sub, email: payload.email, roles: payload.roles || [] };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Token verification failed: ${msg} — ${request.method} ${request.url}`);
      throw new InvalidTokenException(msg);
    }
  }

  private extractBearerToken(request: Request): string | null {
    const auth = request.headers.authorization as string | undefined;
    if (!auth) return null;
    const [scheme, token] = auth.split(' ');
    return scheme === 'Bearer' && token ? token : null;
  }
}
