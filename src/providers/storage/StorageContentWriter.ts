import { LRUCache } from "lru-cache";
import Queue from "p-queue";
import logger, { Logger } from "../../logger";
import { CacheRecord, Performance } from "./types";
import StorageKeyValueAdapter from "./StorageKeyValueAdapter";

export interface StorageContentWriterConfig<V extends object> {
    interval: number;
    storageKeyValueAdapter: StorageKeyValueAdapter<V>;
    instanceId: string;
    objectDeletedFlag: string;
    writeContentConcurrency?: number;
    cacheExpirationTs?: number;
    performance?: Performance;
}

export enum ContentWriterType {
    NEEDS_UPLOAD = "NEEDS_UPLOAD",
    NEEDS_DELETE = "NEEDS_DELETE",
}

const DEFAULT_WRITE_CONTENT_CONCURRENCY = 16;
const DEFAULT_CACHE_EXPIRATION_TS = 5 * 60 * 1000;

interface StorageWriteRecord {
    type: ContentWriterType;
    index: number;
    password: string;
}

export default class StorageContentWriter<K extends string, V extends object> {
    private timeout: ReturnType<typeof setTimeout> | null = null;
    private readonly INTERVAL: number;
    private readonly storageKeyValueAdapter: StorageKeyValueAdapter<V>;
    private readonly logger: Logger;
    private readonly storageWrites: Map<K, StorageWriteRecord> = new Map();
    private readonly instanceId: string;
    private readonly cacheExpirationTs: number;
    private readonly objectDeletedFlag: string;
    private readonly queueWriteContent: Queue;
    private readonly performance: Performance | null;

    constructor(config: StorageContentWriterConfig<V>) {
        this.logger = logger.child({ class: StorageContentWriter.name });
        const {
            writeContentConcurrency,
            interval,
            storageKeyValueAdapter,
            instanceId,
            objectDeletedFlag,
            cacheExpirationTs,
            performance,
        } = config || {};
        this.performance = performance || null;
        this.INTERVAL = interval;
        this.cacheExpirationTs = cacheExpirationTs || DEFAULT_CACHE_EXPIRATION_TS;
        this.storageKeyValueAdapter = storageKeyValueAdapter;
        this.instanceId = instanceId;
        this.objectDeletedFlag = objectDeletedFlag;

        this.queueWriteContent = new Queue({
            concurrency: writeContentConcurrency || DEFAULT_WRITE_CONTENT_CONCURRENCY,
        });
    }

    private async actualizeCacheDelete(key: K, password: string): Promise<void> {
        const objects = await this.storageKeyValueAdapter.listFiles(key);
        const objectsToDelete = objects.filter((object) => !object.name.endsWith(this.objectDeletedFlag));

        await Promise.all(objectsToDelete.map((object) => this.storageKeyValueAdapter.delete(object.name)));

        if (objectsToDelete.length === objects.length) {
            await this.storageKeyValueAdapter.set(`${key}/${this.objectDeletedFlag}`, null, password);
        }
    }

    private async actualizeCacheUpload(
        key: K,
        password: string,
        cache: LRUCache<K, Map<string, CacheRecord<V>>>,
    ): Promise<void> {
        const instances = cache.get(key);
        const instance = instances?.get(this.instanceId);
        if (!instances || !instance) {
            logger.error(
                {
                    key,
                    instancesSize: instances?.size,
                    value: instance,
                },
                "Attempted to upload non-existing value",
            );

            return;
        }
        if (instance.value) {
            const startUpload: number | undefined = this.performance?.now();
            await this.storageKeyValueAdapter.set(`${key}/${this.instanceId}`, instance.value, password);
            if (this.performance && startUpload !== undefined) {
                const finishUpload = this.performance.now();
                logger.info(`Uploading took ${(finishUpload - startUpload).toFixed(1)} ms`);
            }
        }
        await this.deleteOutdatedInstances(key, instances);
    }

    private async actualizeCache(cache: LRUCache<K, Map<string, CacheRecord<V>>>): Promise<void> {
        const logger = this.logger.child({ method: this.actualizeCache.name });

        if (this.storageWrites.size) {
            Array.from(this.storageWrites.entries()).forEach(([key, { type, index, password }]) => {
                this.queueWriteContent.add(async () => {
                    try {
                        switch (type) {
                            case ContentWriterType.NEEDS_DELETE:
                                await this.actualizeCacheDelete(key, password);
                                break;
                            case ContentWriterType.NEEDS_UPLOAD:
                                await this.actualizeCacheUpload(key, password, cache);
                                break;
                            default:
                                break;
                        }
                        // delete only if the current index is up to date
                        if (index === this.storageWrites.get(key)?.index) {
                            this.storageWrites.delete(key);
                        }
                    } catch (err) {
                        logger.error(
                            {
                                err,
                                size: this.storageWrites.size,
                            },
                            `Error storage writing ${key}`,
                        );
                    }
                });
            });

            await this.queueWriteContent.onIdle();
            logger.info({ size: this.storageWrites.size }, "Success storage writing");
        }
    }

    private async deleteOutdatedInstances(key: string, instances: Map<string, CacheRecord<V>>): Promise<void> {
        const expiredTs = Date.now() - this.cacheExpirationTs;

        const instancesToDelete: [string, CacheRecord<V>][] = [];

        instances?.forEach((instance, instanceId) => {
            const isOutdated = instance.modifiedTs < expiredTs;
            const isNotNull = Boolean(instance.value);

            if (instanceId !== this.instanceId && isNotNull && isOutdated) {
                instancesToDelete.push([instanceId, instance]);
            }
        });

        // For safety, always preserve one additional copy in storage
        if (instancesToDelete.length <= 1) {
            return;
        }

        // Finding the most up-to-date instance to preserve
        instancesToDelete
            .sort((a, b) => {
                const diff = a[1].modifiedTs - b[1].modifiedTs;
                if (diff === 0) {
                    return a[0] >= b[0] ? 1 : -1;
                }

                return diff;
            })
            .pop();

        await Promise.allSettled(
            instancesToDelete.map(([instanceId]) =>
                this.storageKeyValueAdapter
                    .delete(`${key}/${instanceId}`)
                    .then(() => {
                        instances.delete(instanceId);
                    })
                    .catch((err) => this.logger.error({ err }, "Error deleting outdated instance")),
            ),
        );
    }

    public startActualizeCacheTimer(cache: LRUCache<K, Map<string, CacheRecord<V>>>): void {
        if (this.INTERVAL) {
            if (this.timeout) clearTimeout(this.timeout);
            this.timeout = setTimeout(async () => {
                await this.actualizeCache(cache);
                this.startActualizeCacheTimer(cache);
            }, this.INTERVAL);
        }
    }

    public stop(): void {
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = null;
    }

    public set(key: K, type: ContentWriterType, password: string): void {
        const oldValue = this.storageWrites.get(key);
        this.storageWrites.set(key, {
            type,
            index: oldValue?.index ? oldValue.index + 1 : 1,
            password,
        });
    }

    public get(key: K): ContentWriterType | null {
        return this.storageWrites.get(key)?.type || null;
    }

    public clear(): void {
        this.storageWrites.clear();
    }

    public async shutdown(cache: LRUCache<K, Map<string, CacheRecord<V>>>): Promise<void> {
        this.stop();
        await this.actualizeCache(cache);
    }
}
