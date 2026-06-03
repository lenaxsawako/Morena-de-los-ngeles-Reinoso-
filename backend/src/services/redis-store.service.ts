import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { IStore } from '../interfaces/store.interface';

@Injectable()
export class RedisStoreService implements IStore, OnModuleDestroy {
  private readonly logger = new Logger(RedisStoreService.name);
  private readonly store = new Map<string, { value: any; expiresAt?: number }>();

  async get(key: string) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: any, ttl?: number) {
    const expiresAt = ttl ? Date.now() + ttl : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string) {
    this.store.delete(key);
  }

  async incr(key: string) {
    const val = (await this.get(key)) || 0;
    const next = Number(val) + 1;
    await this.set(key, next);
    return next;
  }

  async decr(key: string) {
    const val = (await this.get(key)) || 0;
    const next = Number(val) - 1;
    await this.set(key, next);
    return next;
  }

  async exists(key: string) {
    const val = await this.get(key);
    return val !== null && val !== undefined;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const entry = this.store.get(key);
    if (!entry) return [];
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return [];
    }
    const arr = Array.isArray(entry.value) ? entry.value : [String(entry.value)];
    // Handle negative indices and inclusive stop
    const len = arr.length;
    const normStart = start < 0 ? Math.max(0, len + start) : Math.min(len - 1, start);
    const normStop = stop < 0 ? len + stop : stop;
    const sliced = arr.slice(normStart, normStop === -1 ? undefined : normStop + 1);
    return sliced.map(String);
  }

  async lpush(key: string, value: string): Promise<number> {
    const entry = this.store.get(key);
    let arr: string[] = [];
    let expiresAt: number | undefined = undefined;
    if (entry) {
      expiresAt = entry.expiresAt;
      arr = Array.isArray(entry.value) ? entry.value : [String(entry.value)];
    }
    arr.unshift(value);
    this.store.set(key, { value: arr, expiresAt });
    return arr.length;
  }

  async llen(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return 0;
    }
    const arr = Array.isArray(entry.value) ? entry.value : [String(entry.value)];
    return arr.length;
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    const entry = this.store.get(key);
    if (!entry) return;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return;
    }
    const arr = Array.isArray(entry.value) ? entry.value : [String(entry.value)];
    const len = arr.length;
    const normStart = start < 0 ? Math.max(0, len + start) : Math.min(len - 1, Math.max(0, start));
    const normStop = stop < 0 ? len + stop : stop;
    const sliced = arr.slice(normStart, normStop === -1 ? undefined : normStop + 1);
    entry.value = sliced;
    this.store.set(key, entry);
  }

  async setnx(key: string, value: any, ttl?: number): Promise<number> {
    const exists = await this.exists(key);
    if (exists) return 0;
    await this.set(key, value, ttl);
    return 1;
  }

  async expire(key: string, ttlMs: number): Promise<void> {
    const entry = this.store.get(key);
    if (!entry) return;
    entry.expiresAt = Date.now() + ttlMs;
    this.store.set(key, entry);
  }

  async flushAll() {
    this.store.clear();
  }

  onModuleDestroy() {
    this.flushAll();
  }
}
