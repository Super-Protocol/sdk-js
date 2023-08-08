import StorageObject from "../../types/storage/StorageObject";
import logger, { Logger } from "../../logger";
import { CacheRecord } from "./types";
import StorageKeyValueAdapter from "./StorageKeyValueAdapter";

export interface InstancesUpdates {
    updated: Map<string, StorageObject>;
    deleted: Set<string>;
}

interface Config<V extends object> {
    storageKeyValueAdapter: StorageKeyValueAdapter<V>;
    objectDeletedFlag: string;
}

export class StorageMetadataReader<K extends string, V extends object> {
    private readonly logger: Logger;
    private readonly storageKeyValueAdapter: StorageKeyValueAdapter<V>;
    private readonly objectDeletedFlag: string;

    constructor(config: Config<V>) {
        this.logger = logger.child({ class: StorageMetadataReader.name });
        this.storageKeyValueAdapter = config.storageKeyValueAdapter;
        this.objectDeletedFlag = config.objectDeletedFlag;
    }

    private async listInstances(key: K): Promise<Map<string, StorageObject>> {
        return this.storageKeyValueAdapter
            .listFiles(`${key}/`)
            .then((objects) => new Map(objects.map((obj) => [obj.name.split("/")?.pop() || obj.name, obj])));
    }

    async fetchInstancesUpdates(key: K, currentInstances: Map<string, CacheRecord<V>>): Promise<InstancesUpdates> {
        const result: InstancesUpdates = {
            updated: new Map(),
            deleted: new Set(),
        };

        try {
            const directoryInstances = await this.listInstances(key);

            if (directoryInstances.has(this.objectDeletedFlag)) {
                result.deleted.add(key);

                return result;
            }

            directoryInstances.forEach((instance, instanceId) => {
                const currentInstance = currentInstances.get(instanceId);
                if (!currentInstance || currentInstance.modifiedTs < instance.createdAt.getTime()) {
                    result.updated.set(instanceId, instance);
                }
            });

            currentInstances.forEach((_, instanceId) => {
                if (!directoryInstances.has(instanceId)) {
                    result.deleted.add(instanceId);
                }
            });

            this.logger.trace(
                {
                    updated: result.updated.size,
                    deleted: result.deleted.size,
                },
                "Check result",
            );

            return result;
        } catch (error) {
            this.logger.error({ error }, "Error fetching remote copy");

            return result;
        }
    }
}
