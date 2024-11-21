import { LRUCache } from 'lru-cache';
import * as uuid from 'uuid';
import { createHash } from 'crypto';
import Queue from 'p-queue';
import StorageKeyValueAdapter from './StorageKeyValueAdapter.js';
import StorageContentWriter, { ContentWriterType } from './StorageContentWriter.js';
import StorageMetadataReader from './StorageMetadataReader.js';
import StorageAccess from '../../types/storage/StorageAccess.js';
import logger, { Logger } from '../../logger.js';
import { CacheRecord, IStorageAdapter, Performance } from './types.js';
import PubSub from '../../utils/PubSub.js';

export interface LRUCacheConfig {
  max: number;
}

export interface StorageAdapterConfig {
  lruCache: LRUCacheConfig;
  writeInterval: number;
  readInterval: number;
  objectDeletedFlag: string;
  readMetadataConcurrency?: number;
  performance?: Performance;
  showLogs?: boolean;
  hasEncryption?: boolean;
  instanceId?: string;
}

export enum CacheEvents {
  INSTANCES_CHANGED = 'INSTANCES_CHANGED',
  KEY_DELETED = 'KEY_DELETED',
}

const DEFAULT_READ_METADATA_CONCURRENCY = 16;

export default class StorageAdapter<V extends object> implements IStorageAdapter<V> {
  private readonly logger?: Logger | null;
  private readonly storageKeyValueAdapter: StorageKeyValueAdapter<V>;
  private readonly cache: LRUCache<string, Map<string, CacheRecord<V>>>;
  private readonly encryptionKeys = new Map<string, string>(); // key -> encryption key (base64)
  private readonly contentWriter: StorageContentWriter<string, V>;
  private readonly metadataReader: StorageMetadataReader<string, V>;
  private readonly instanceId: string;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private readonly readInterval: number;
  private readonly queues = new Map<string, Queue>();
  private readonly queueReadMetadata: Queue;
  private readonly isUpdating = new Map<string, boolean>();
  private readonly pubSub: PubSub<string, { type: CacheEvents; message: unknown }> = new PubSub();
  private readonly eventName = 'storage-adapter';
  private readonly performance?: Performance;

  constructor(storageAccess: StorageAccess, config: StorageAdapterConfig) {
    const {
      readInterval,
      writeInterval,
      lruCache,
      objectDeletedFlag,
      readMetadataConcurrency,
      performance,
      showLogs = true,
      hasEncryption = true,
      instanceId,
    } = config;
    this.logger = showLogs ? logger.child({ class: StorageAdapter.name }) : null;
    this.performance = performance;
    this.instanceId = instanceId ?? this.generateHash();
    this.readInterval = readInterval;
    this.storageKeyValueAdapter = new StorageKeyValueAdapter(storageAccess, {
      showLogs,
      hasEncryption,
    });
    this.cache = new LRUCache(lruCache);
    this.metadataReader = new StorageMetadataReader({
      storageKeyValueAdapter: this.storageKeyValueAdapter,
      objectDeletedFlag,
      showLogs,
    });
    this.contentWriter = new StorageContentWriter({
      interval: writeInterval,
      storageKeyValueAdapter: this.storageKeyValueAdapter,
      instanceId: this.instanceId,
      objectDeletedFlag,
      performance: this.performance,
      showLogs,
    });

    this.queueReadMetadata = new Queue({
      concurrency: readMetadataConcurrency || DEFAULT_READ_METADATA_CONCURRENCY,
    });
  }

  private generateHash(str?: string): string {
    return createHash('sha256')
      .update(str || uuid.v4())
      .digest('hex');
  }

  subscribe(cb: (props: { type: CacheEvents; message: unknown }) => void): () => void {
    this.pubSub.subscribe(this.eventName, cb);

    return () => {
      this.pubSub.unsubscribe(this.eventName, cb);
    };
  }

  private publish(type: CacheEvents, message: unknown): void {
    this.pubSub.publish(this.eventName, {
      type,
      message,
    });
  }

  async has(key: string): Promise<boolean> {
    if (!this.cache.has(key)) {
      await this.getQueue(key).add(async () => {
        if (!this.cache.has(key)) {
          await this.checkUpdates(key);
        }
      });
    }

    return this.cache.has(key);
  }

  private getEncryptionKey(key: string, encryptionKeyBuffer?: Buffer): string | null {
    if (!this.encryptionKeys.has(key)) {
      if (!encryptionKeyBuffer) {
        return null;
      }
      const encryptionKey = encryptionKeyBuffer.toString('base64');
      this.encryptionKeys.set(key, encryptionKey);

      return encryptionKey;
    }

    return this.encryptionKeys.get(key) || null;
  }

  set(key: string, value: V, encryptionKeyBuffer?: Buffer): void {
    if (this.contentWriter.storageWrites.get(key)?.type === ContentWriterType.NEEDS_DELETE) {
      throw new Error('Object has been deleted');
    }
    const encryptionKey = this.getEncryptionKey(key, encryptionKeyBuffer);
    this.setByInstance(key, this.instanceId, {
      value,
      modifiedTs: Number.MAX_SAFE_INTEGER,
    });
    this.contentWriter.set(key, ContentWriterType.NEEDS_UPLOAD, encryptionKey || undefined);
  }

  private setByInstance(key: string, instanceId: string, value: CacheRecord<V>): void {
    const instances = this.cache.get(key) || new Map();
    instances.set(instanceId, value);
    this.cache.set(key, instances);
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.isUpdating.delete(key);

    const encryptionKey = this.getEncryptionKey(key);
    if (encryptionKey) {
      this.contentWriter.set(key, ContentWriterType.NEEDS_DELETE, encryptionKey);
      this.encryptionKeys.delete(key);
    } else {
      this.logger?.error(`Encryption key for key ${key} is not set`);
    }

    this.clearQueue(key);
  }

  // the first value is always the current instance, if key exists
  async get(key: string, encryptionKeyBuffer?: Buffer): Promise<(V | null)[] | null> {
    if (
      this.contentWriter.storageWrites.get(key)?.type === ContentWriterType.NEEDS_DELETE ||
      !(await this.has(key))
    ) {
      return null;
    }
    const encryptionKey = this.getEncryptionKey(key, encryptionKeyBuffer);
    if (this.cacheHasNullInstances(key)) {
      await this.getQueue(key).add(async () => {
        if (this.cacheHasNullInstances(key)) {
          await this.fetchNullValues(key, encryptionKey || undefined);
        }
      });
    }

    const map = this.cache.get(key);
    if (!map?.size) return null;
    const currentInstance = map.get(this.instanceId)?.value || null;
    const otherInstances = Array.from(map.entries()).reduce(
      (acc, [instanceId, instance]) => {
        return instanceId !== this.instanceId ? [...acc, instance?.value || null] : acc;
      },
      [] as (V | null)[],
    );

    return [currentInstance, ...otherInstances];
  }

  private getQueue(key: string): Queue {
    let queue = this.queues.get(key);

    if (!queue) {
      queue = new Queue({ concurrency: 1 });
      this.queues.set(key, queue);
    }

    return queue;
  }

  private clearQueue(key: string): void {
    const queue = this.queues.get(key);
    queue?.clear();
    this.queues.delete(key);
  }

  private cacheHasNullInstances(key: string): boolean {
    return Array.from(this.cache.get(key)?.values() || []).some(
      (instance) => instance.value === null,
    );
  }

  private async fetchNullValues(key: string, encryptionKey?: string): Promise<void> {
    const promises: Promise<void>[] = [];

    this.cache.get(key)?.forEach((instance, instanceId) => {
      if (instance.value === null) {
        const fileName = `${key}/${instanceId}`;
        const startDownload: number | undefined = this.performance?.now();

        promises.push(
          this.storageKeyValueAdapter
            .get(fileName, encryptionKey)
            .then((file) => {
              if (this.performance && startDownload !== undefined) {
                const finishDownload = this.performance.now();
                logger.info(`Downloading took ${(finishDownload - startDownload).toFixed(1)} ms`);
              }
              this.setByInstance(key, instanceId, {
                ...instance,
                value: file,
              });
            })
            .catch((err) => this.logger?.error({ err }, 'Error fetching content')),
        );
      }
    });

    await Promise.all(promises);
  }

  clear(): void {
    this.cache.clear();
    this.contentWriter.clear();
  }

  run(): void {
    this.contentWriter.startActualizeCacheTimer(this.cache);

    if (this.readInterval) {
      this.startUpdatesChecking();
    }
  }

  private async checkUpdates(key: string): Promise<void> {
    if (
      this.isUpdating.get(key) ||
      this.contentWriter.storageWrites.get(key)?.type === ContentWriterType.NEEDS_DELETE
    ) {
      return;
    }
    this.isUpdating.set(key, true);

    try {
      if (!this.cache.has(key)) {
        this.cache.set(key, new Map());
      }
      const cachedByKey = this.cache.get(key) as Map<string, CacheRecord<V>>;
      const initialSize = cachedByKey.size;

      const { updated, deleted } = await this.metadataReader.fetchInstancesUpdates(
        key,
        cachedByKey,
      );

      if (deleted.has(key)) {
        this.delete(key);
        this.publish(CacheEvents.KEY_DELETED, key);

        return;
      }

      updated.forEach((storageObject, instanceId) => {
        cachedByKey.set(instanceId, {
          value: null,
          modifiedTs: storageObject.createdAt.getTime(),
        });
      });

      if (updated.size && initialSize) {
        this.publish(CacheEvents.INSTANCES_CHANGED, key);
      }

      deleted.forEach((instanceId) => {
        if (instanceId !== this.instanceId) {
          cachedByKey.delete(instanceId);
        }
      });

      if (!cachedByKey.size) {
        this.cache.delete(key);
      }
    } catch (err) {
      this.logger?.error({ err }, 'Error checking updates');

      return;
    } finally {
      this.isUpdating.set(key, false);
    }
  }

  private startUpdatesChecking(): void {
    this.stopUpdatesChecking();
    this.timeout = setTimeout(async () => {
      Array.from(this.cache.keys()).forEach((key) => {
        void this.queueReadMetadata.add(async () => {
          await this.getQueue(key).add(async () => {
            await this.checkUpdates(key);
          });
        });
      });

      await this.queueReadMetadata.onIdle();

      this.startUpdatesChecking();
    }, this.readInterval);
  }

  private stopUpdatesChecking(): void {
    if (this.timeout) clearTimeout(this.timeout);
  }

  stop(): void {
    this.stopUpdatesChecking();
    this.contentWriter.stop();
  }

  async shutdown(): Promise<void> {
    this.stop();
    await this.contentWriter.shutdown(this.cache);
  }
}
