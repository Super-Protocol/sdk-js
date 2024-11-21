import StorageAccess from '../../types/storage/StorageAccess.js';
import logger, { Logger } from '../../logger.js';
import StorageAdapter, { StorageAdapterConfig, CacheEvents } from './StorageAdapter.js';
import { StorjCredentials } from '@super-protocol/dto-js';

export type StorjConfig = StorageAdapterConfig;

export default class StorjAdapter<V extends object> {
  private storageAdapter: StorageAdapter<V>;
  private readonly logger?: Logger | null;

  constructor(storageAccess: StorageAccess<StorjCredentials>, config: StorjConfig) {
    const { showLogs = true } = config || {};
    this.logger = showLogs ? logger.child({ class: StorjAdapter.name }) : null;
    this.storageAdapter = new StorageAdapter(storageAccess, config);
    this.storageAdapter.run();
  }

  subscribe(cb: (props: { type: CacheEvents; message: unknown }) => void): () => void {
    return this.storageAdapter?.subscribe(cb);
  }

  async get(key: string, encryptionKey: Buffer): Promise<(V | null)[] | null> {
    try {
      return await this.storageAdapter.get(key, encryptionKey);
    } catch (err) {
      const message = (err as Error).message?.toLowerCase() || '';
      if (message.includes('object not found') || message.includes('object has been deleted')) {
        this.logger?.info({ key }, 'Object not found');

        return null;
      }
      throw err;
    }
  }

  has(key: string): Promise<boolean> {
    return this.storageAdapter.has(key);
  }

  set(key: string, value: V, encryptionKey: Buffer): void {
    try {
      this.storageAdapter.set(key, value, encryptionKey);
    } catch (err) {
      const message = (err as Error).message?.toLowerCase() || '';
      if (message.includes('object has been deleted')) {
        this.logger?.info({ key }, 'Object has been deleted');

        return;
      }
      throw err;
    }
  }

  del(key: string): void {
    this.storageAdapter.delete(key);
  }

  stop(): void {
    this.storageAdapter.stop();
  }

  async shutdown(): Promise<void> {
    await this.storageAdapter.shutdown();
  }
}
