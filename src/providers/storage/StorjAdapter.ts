import StorageAccess from "../../types/storage/StorageAccess";
import logger, { Logger } from "../../logger";
import StorageAdapter, { StorageAdapterConfig, CacheEvents } from "./StorageAdapter";

export type StorjConfig = StorageAdapterConfig;

export default class StorjAdapter<V extends object> {
    private storageAdapter: StorageAdapter<V>;
    private readonly logger: Logger;
    constructor(storageAccess: StorageAccess, config: StorjConfig) {
        this.logger = logger.child({ class: StorjAdapter.name });
        this.storageAdapter = new StorageAdapter(storageAccess, config);
        this.storageAdapter.run();
    }
    public subscribe(cb: (props: { type: CacheEvents; message: unknown }) => void) {
        return this.storageAdapter?.subscribe(cb);
    }
    public async get(key: string, password: Buffer) {
        return this.storageAdapter.get(key, password).catch((err: Error) => {
            if (err.message.includes("object not found")) {
                this.logger.info({ key }, "Object not found");

                return null;
            }
            throw err;
        });
    }
    public async has(key: string) {
        return this.storageAdapter.has(key);
    }
    public async set(key: string, value: V, password: Buffer) {
        return this.storageAdapter.set(key, value, password);
    }
    public async del(key: string) {
        return this.storageAdapter.delete(key);
    }
    public stop() {
        this.storageAdapter.stop();
    }
    public async shutdown() {
        await this.storageAdapter.shutdown();
    }
}
