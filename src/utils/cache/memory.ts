import { ICache, MemoryCacheOptions } from './types.js';

export class MemoryCache implements ICache {
  protected readonly prefix?: string;
  protected readonly cache: Map<string, { v: unknown | null; ttl?: number }>;

  constructor(options: MemoryCacheOptions = {}) {
    this.prefix = options.prefix;
    this.cache = options.initCache ?? new Map<string, { v: unknown | null; ttl?: number }>();
  }

  add(key: string, value: unknown | null, ttl?: number): boolean {
    if (value !== undefined && !this.cache.has(this.getPrefixedKey(key))) {
      this.cache.set(this.getPrefixedKey(key), {
        v: value,
        ...(ttl && { ttl: Date.now() + ttl * 1000 }),
      });

      return true;
    }

    return false;
  }

  del(...keys: string[]): boolean {
    keys.forEach((k) => this.cache.delete(this.getPrefixedKey(k)));

    return true;
  }

  get(key: string): unknown | null | undefined {
    const data = this.cache.get(this.getPrefixedKey(key));

    if (data) {
      if (!data.ttl || data.ttl >= Date.now()) {
        return data.v;
      }
      this.del(this.getPrefixedKey(key));
    }

    return;
  }

  set(key: string, value: unknown | null, ttl?: number): void {
    if (value !== undefined) {
      this.cache.set(this.getPrefixedKey(key), {
        v: value,
        ...(ttl && { ttl: Date.now() + ttl * 1000 }),
      });
    }
  }

  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options?: {
      ttl?: number;
      force?: boolean;
    },
  ): Promise<T> {
    const { ttl, force = false } = options ?? {};
    let val = force ? undefined : (this.cache.get(this.getPrefixedKey(key))?.v as T);

    if (val === undefined) {
      val = await fn();
      this.set(key, val, ttl);
    }

    return val;
  }

  protected getPrefixedKey(key: string): string {
    return this.prefix ? `${this.prefix}-${key}` : key;
  }
}

export const createMemoryCache = (options: Partial<MemoryCacheOptions> = {}): ICache => {
  return new MemoryCache({
    prefix: options.prefix ?? 'sp',
    initCache: options.initCache,
  });
};
