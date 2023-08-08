import { performance } from "node:perf_hooks";
import LRUCache from "lru-cache";
import { createHash, randomUUID } from "node:crypto";
import Queue from "p-queue";
import StorageKeyValueAdapter, { ICipherService } from "./StorageKeyValueAdapter";
import { StorageContentWriter, ContentWriterType } from "./StorageContentWriter";
import { StorageMetadataReader } from "./StorageMetadataReader";
import StorageAccess from "../../types/storage/StorageAccess";
import logger, { Logger } from "../../logger";
import { CacheRecord } from "./types";
import PubSub from "../../utils/PubSub";

export interface LRUCacheConfig {
    max: number;
}

export interface Config {
    lruCache: LRUCacheConfig;
    writeInterval: number;
    readInterval: number;
    objectDeletedFlag: string;
    cipherService: ICipherService;
    readMetadataConcurrency?: number;
}

export enum CacheEvents {
    INSTANCES_CHANGED = "MESSAGES_CHANGED",
    KEY_DELETED = "KEY_DELETED",
}

const DEFAULT_READ_METADATA_CONCUREENCY = 16;

export default class StorageAdapter<V extends object> {
    private readonly logger: Logger;
    private readonly storageKeyValueAdapter: StorageKeyValueAdapter<V>;
    private readonly cache: LRUCache<string, Map<string, CacheRecord<V>>>;
    private readonly passwords = new Map<string, string>(); // key -> password
    private readonly deleted = new Set<string>();
    private readonly contentWriter: StorageContentWriter<string, V>;
    private readonly metadataReader: StorageMetadataReader<string, V>;
    private readonly instanceId: string;
    private timeout: ReturnType<typeof setTimeout> | null = null;
    private readonly readInterval: number;
    private readonly queues = new Map<string, Queue>();
    private readonly queueReadMetadata: Queue;
    private readonly isUpdating = new Map<string, boolean>();
    private readonly pubSub: PubSub<string, { type: CacheEvents; message: unknown }> = new PubSub();
    private readonly eventName = "storage-adapter";

    constructor(storageAccess: StorageAccess, config: Config) {
        this.logger = logger.child({ class: StorageAdapter.name });
        const { readInterval, writeInterval, lruCache, objectDeletedFlag, cipherService, readMetadataConcurrency } =
            config;
        this.instanceId = this.generateHash();
        this.readInterval = readInterval;
        this.storageKeyValueAdapter = new StorageKeyValueAdapter(storageAccess, cipherService);
        this.cache = new LRUCache(lruCache);
        this.metadataReader = new StorageMetadataReader({
            storageKeyValueAdapter: this.storageKeyValueAdapter,
            objectDeletedFlag,
        });
        this.contentWriter = new StorageContentWriter({
            interval: writeInterval,
            storageKeyValueAdapter: this.storageKeyValueAdapter,
            instanceId: this.instanceId,
            objectDeletedFlag,
        });

        this.queueReadMetadata = new Queue({
            concurrency: readMetadataConcurrency || DEFAULT_READ_METADATA_CONCUREENCY,
        });
    }

    private generateHash(str?: string): string {
        return createHash("sha256")
            .update(str || randomUUID())
            .digest("hex");
    }

    public async subscribe(cb: (props: { type: CacheEvents; message: unknown }) => void): Promise<() => Promise<void>> {
        this.pubSub.subscribe(this.eventName, cb);

        return async () => {
            this.pubSub.unsubscribe(this.eventName, cb);
        };
    }

    private publish(type: CacheEvents, message: unknown) {
        this.pubSub.publish(this.eventName, {
            type,
            message,
        });
    }

    public async has(key: string): Promise<boolean> {
        if (!this.cache.has(key)) {
            await this.getQueue(key).add(async () => {
                if (!this.cache.has(key)) {
                    await this.checkUpdates(key);
                }
            });
        }

        return this.cache.has(key);
    }

    public async set(key: string, value: V, password: string): Promise<void> {
        if (this.deleted.has(key)) {
            throw new Error("Object has been deleted");
        }
        if (!this.passwords.has(key)) {
            this.passwords.set(key, password);
        }
        this.setByInstance(key, this.instanceId, {
            value,
            modifiedTs: Number.MAX_SAFE_INTEGER,
        });
        this.contentWriter.set(key, ContentWriterType.NEEDS_UPLOAD, password);
    }

    private setByInstance(key: string, instanceId: string, value: CacheRecord<V>) {
        const instances = this.cache.get(key) || new Map();
        instances.set(instanceId, value);
        this.cache.set(key, instances);
    }

    public async delete(key: string): Promise<void> {
        this.deleted.add(key);
        this.cache.delete(key);
        this.isUpdating.delete(key);

        const password = this.passwords.get(key);
        if (password) {
            this.contentWriter.set(key, ContentWriterType.NEEDS_DELETE, password);
            this.passwords.delete(key);
        } else {
            this.logger.error(`Password for key ${key} is not set`);
        }

        this.clearQueue(key);
    }

    // the first value is always the current instance, if key exists
    public async get(key: string, password: string): Promise<(V | null)[] | null> {
        if (this.deleted.has(key) || !(await this.has(key))) {
            return null;
        }
        if (!this.passwords.has(key)) {
            this.passwords.set(key, password);
        }
        if (this.cacheHasNullInstances(key)) {
            await this.getQueue(key).add(async () => {
                if (this.cacheHasNullInstances(key)) {
                    await this.fetchNullValues(key, password);
                }
            });
        }

        const map = this.cache.get(key);
        if (!map?.size) return null;
        const currentInstance = map.get(this.instanceId)?.value || null;
        const otherInstances = Array.from(map.entries()).reduce((acc, [instanceId, instance]) => {
            return instanceId !== this.instanceId ? [...acc, instance?.value || null] : acc;
        }, [] as (V | null)[]);

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
        return Array.from(this.cache.get(key)?.values() || []).some((instance) => instance.value === null);
    }

    private async fetchNullValues(key: string, password: string) {
        const promises: Promise<void>[] = [];

        this.cache.get(key)?.forEach((instance, instanseId) => {
            if (instance.value === null) {
                const fileName = `${key}/${instanseId}`;
                const startDownload = performance.now();

                promises.push(
                    this.storageKeyValueAdapter
                        .get(fileName, password)
                        .then((file) => {
                            const finishDownload = performance.now();
                            logger.info(`Downloading took ${(finishDownload - startDownload).toFixed(1)} ms`);
                            this.setByInstance(key, instanseId, {
                                ...instance,
                                value: file,
                            });
                        })
                        .catch((err) => this.logger.error({ err }, "Error fetching content")),
                );
            }
        });

        await Promise.all(promises);
    }

    public clear(): void {
        this.cache.clear();
        this.contentWriter.clear();
    }

    public run(): void {
        this.contentWriter.startActualizeCacheTimer(this.cache);

        if (this.readInterval) {
            this.startUpdatesChecking();
        }
    }

    private async checkUpdates(key: string) {
        if (this.isUpdating.get(key) || this.deleted.has(key)) {
            return;
        }
        this.isUpdating.set(key, true);

        try {
            if (!this.cache.has(key)) {
                this.cache.set(key, new Map());
            }
            const cachedByKey = this.cache.get(key) as Map<string, CacheRecord<V>>;
            const initialSize = cachedByKey.size;

            const { updated, deleted } = await this.metadataReader.fetchInstancesUpdates(key, cachedByKey);

            if (deleted.has(key)) {
                await this.delete(key);
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
            this.logger.error({ err }, "Error checking updates");

            return;
        } finally {
            this.isUpdating.set(key, false);
        }
    }

    private async startUpdatesChecking() {
        this.stopUpdatesChecking();
        this.timeout = setTimeout(async () => {
            Array.from(this.cache.keys()).forEach((key) => {
                this.queueReadMetadata.add(async () => {
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

    public stop(): void {
        this.stopUpdatesChecking();
        this.contentWriter.stop();
    }

    public async shutdown(): Promise<void> {
        this.stop();
        await this.contentWriter.shutdown(this.cache);
    }
}
