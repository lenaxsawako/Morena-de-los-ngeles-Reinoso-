import { Injectable, Global, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { IStore } from '../interfaces/store.interface';

@Global()
@Injectable()
export class RedisStoreService implements IStore, OnModuleDestroy {
  private readonly logger = new Logger(RedisStoreService.name);
  private readonly client: Redis;

  constructor(configService: ConfigService) {
    const url = configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });
  }

  async get(key: string) {
    try {
      const val = await this.client.get(key);
      if (val === null) return null;
      return JSON.parse(val);
    } catch (err) {
      this.logger.error(`get failed: ${(err as Error).message}`);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number) {
    try {
      const serialized = JSON.stringify(value);
      if (ttl !== undefined) {
        await this.client.set(key, serialized, 'PX', ttl);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (err) {
      this.logger.error(`set failed: ${(err as Error).message}`);
    }
  }

  async del(key: string) {
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.error(`del failed: ${(err as Error).message}`);
    }
  }

  async incr(key: string) {
    try {
      return await this.client.incr(key);
    } catch (err) {
      this.logger.error(`incr failed: ${(err as Error).message}`);
      return 0;
    }
  }

  async decr(key: string) {
    try {
      return await this.client.decr(key);
    } catch (err) {
      this.logger.error(`decr failed: ${(err as Error).message}`);
      return 0;
    }
  }

  async exists(key: string) {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (err) {
      this.logger.error(`exists failed: ${(err as Error).message}`);
      return false;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lrange(key, start, stop);
    } catch (err) {
      this.logger.error(`lrange failed: ${(err as Error).message}`);
      return [];
    }
  }

  async lpush(key: string, value: string): Promise<number> {
    try {
      return await this.client.lpush(key, value);
    } catch (err) {
      this.logger.error(`lpush failed: ${(err as Error).message}`);
      return 0;
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await this.client.llen(key);
    } catch (err) {
      this.logger.error(`llen failed: ${(err as Error).message}`);
      return 0;
    }
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    try {
      await this.client.ltrim(key, start, stop);
    } catch (err) {
      this.logger.error(`ltrim failed: ${(err as Error).message}`);
    }
  }

  async setnx(key: string, value: any, ttl?: number): Promise<number> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl !== undefined) {
        const result = await this.client.set(key, serialized, 'PX', ttl, 'NX');
        return result === 'OK' ? 1 : 0;
      }
      const result = await this.client.setnx(key, serialized);
      return result;
    } catch (err) {
      this.logger.error(`setnx failed: ${(err as Error).message}`);
      return 0;
    }
  }

  async expire(key: string, ttlMs: number): Promise<void> {
    try {
      await this.client.pexpire(key, ttlMs);
    } catch (err) {
      this.logger.error(`expire failed: ${(err as Error).message}`);
    }
  }

  async flushAll() {
    try {
      await this.client.flushall();
    } catch (err) {
      this.logger.error(`flushAll failed: ${(err as Error).message}`);
    }
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
