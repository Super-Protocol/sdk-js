export interface CacheRecord<V> {
    value: V | null;
    modifiedTs: number;
}
