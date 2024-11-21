export interface ICache {
  add(key: string, value: unknown, ttl?: number): boolean;
  del(...keys: string[]): boolean;
  get(key: string): unknown | undefined;
  set(key: string, value: unknown, ttl?: number): void;
  wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options?: {
      ttl?: number;
      force?: boolean;
    },
  ): Promise<T>;
}

export type MemoryCacheOptions = {
  prefix?: string;
  initCache?: Map<string, { v: unknown | null; ttl?: number }>;
};
