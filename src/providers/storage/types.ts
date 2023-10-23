export interface CacheRecord<V> {
  value: V | null;
  modifiedTs: number;
}

export interface Performance {
  now(): number;
}
