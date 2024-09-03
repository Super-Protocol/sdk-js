import { CacheEvents, StorageObject } from '../../index.js';

export interface CacheRecord<V> {
  value: V | null;
  modifiedTs: number;
}

export interface Performance {
  now(): number;
}

export interface IStorageKeyValueAdapter<V extends object> {
  set(key: string, value: V | null, privateKey?: string): Promise<void>;
  delete(key: string): Promise<void>;
  get(key: string, privateKey?: string): Promise<V | null>;
  listFiles(key: string): Promise<StorageObject[]>;
}

export interface IStorageAdapter<V extends object> {
  has(key: string): Promise<boolean>;
  set(key: string, value: V, encryptionKeyBuffer?: Buffer): void;
  delete(key: string): void;
  run(): void;
  clear(): void;
  get(key: string, encryptionKeyBuffer?: Buffer): Promise<(V | null)[] | null>;
  stop(): void;
  subscribe(cb: (props: { type: CacheEvents; message: unknown }) => void): () => void;
  shutdown(): Promise<void>;
}
