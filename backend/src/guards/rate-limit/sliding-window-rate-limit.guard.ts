import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { GUARD_METADATA } from '../../constants/guard.constants';
import { RedisStoreService } from '../../services/redis-store.service';
import { IpExtractorService } from '../../services/ip-extractor.service';
import { RateLimitExceededException } from '../../exceptions/throttle.exception';

export interface SlidingWindowOptions {
  windowMs: number;
  max: number;
  keyBy?: 'ip' | 'user' | 'custom';
  keyGenerator?: (req: Request) => string;
  skipIf?: (req: Request) => boolean;
}

@Injectable()
export class SlidingWindowRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(SlidingWindowRateLimitGuard.name);

  constructor(private reflector: Reflector, private store: RedisStoreService, private ipExtractor: IpExtractorService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<SlidingWindowOptions>(GUARD_METADATA.RATE_LIMIT_OPTIONS, [context.getHandler(), context.getClass()]);
    if (!options) return true;

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    if (options.skipIf?.(request)) return true;

    const key = this.buildKey(request, options);
    const now = Date.now();
    const windowStart = now - options.windowMs;

    const raw = await this.store.lrange(key, 0, -1);
    const timestamps = raw.map(Number).filter((ts) => ts > windowStart);

    const count = timestamps.length;
    const remaining = Math.max(0, options.max - count - 1);
    const resetAt = timestamps.length > 0 ? Math.ceil((timestamps[timestamps.length - 1] + options.windowMs) / 1000) : Math.ceil((now + options.windowMs) / 1000);

    response.setHeader('X-RateLimit-Limit', options.max);
    response.setHeader('X-RateLimit-Remaining', String(remaining));
    response.setHeader('X-RateLimit-Reset', String(resetAt));

    if (count >= options.max) {
      const retryAfter = Math.ceil((timestamps[timestamps.length - 1] + options.windowMs - now) / 1000);
      response.setHeader('Retry-After', String(retryAfter));
      this.logger.warn(`Rate limit exceeded for key: ${key}`);
      throw new RateLimitExceededException(options.max, options.windowMs, retryAfter);
    }

    await this.store.lpush(key, String(now));
    const validTimestamps = [String(now), ...raw.filter((ts) => Number(ts) > windowStart)];
    await this.store.del(key);
    for (const ts of validTimestamps.reverse()) await this.store.lpush(key, ts);
    await this.store.expire(key, options.windowMs * 2);

    return true;
  }

  protected buildKey(request: Request, options: SlidingWindowOptions): string {
    if (options.keyGenerator) return `rateLimit:${options.keyGenerator(request)}`;
    if (options.keyBy === 'user') {
      const user = (request as any).user;
      return `rateLimit:user:${user?.sub ?? 'anonymous'}`;
    }
    const ip = this.ipExtractor.getClientIp(request);
    return `rateLimit:ip:${ip}`;
  }
}
