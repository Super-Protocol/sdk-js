import { Encryption } from '@super-protocol/dto-js';
import { StorageObject } from '../../index.js';

export interface CacheRecord<V> {
  value: V | null;
  modifiedTs: number;
}

export interface Performance {
  now(): number;
}

export interface IStorageKeyValueAdapter<V extends object> {
  decrypt(encryption: Encryption, key: string): Promise<V | null>;
  encrypt(data: V | null, key: string): Promise<Encryption>;
  set(key: string, value: V | null, privateKey: string): Promise<void>;
  delete(key: string): Promise<void>;
  get(key: string, privateKey: string): Promise<V | null>;
  listFiles(key: string): Promise<StorageObject[]>;
}
