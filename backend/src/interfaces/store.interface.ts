export interface IStore {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
  decr(key: string): Promise<number>;
  exists(key: string): Promise<boolean>;
  lrange?(key: string, start: number, stop: number): Promise<string[]>;
  lpush?(key: string, value: string): Promise<number>;
  expire?(key: string, ttlMs: number): Promise<void>;
  flushAll?(): Promise<void>;
}
