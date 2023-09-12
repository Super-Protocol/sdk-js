import StorageAccess from '../../types/storage/StorageAccess';
import logger, { Logger } from '../../logger';
import StorageAdapter, { StorageAdapterConfig, CacheEvents } from './StorageAdapter';

export type StorjConfig = StorageAdapterConfig;

export default class StorjAdapter<V extends object> {
    private storageAdapter: StorageAdapter<V>;
    private readonly logger?: Logger | null;
    constructor(storageAccess: StorageAccess, config: StorjConfig) {
        const { showLogs = true } = config || {};
        this.logger = showLogs ? logger.child({ class: StorjAdapter.name }) : null;
        this.storageAdapter = new StorageAdapter(storageAccess, config);
        this.storageAdapter.run();
    }
    public subscribe(cb: (props: { type: CacheEvents; message: unknown }) => void) {
        return this.storageAdapter?.subscribe(cb);
    }
    public async get(key: string, encryptionKey: Buffer): Promise<(V | null)[] | null> {
        return this.storageAdapter.get(key, encryptionKey).catch((err: Error) => {
            const message = err.message?.toLowerCase() || '';
            if (
                message.includes('object not found') ||
                message.includes('object has been deleted')
            ) {
                this.logger?.info({ key }, 'Object not found');

                return null;
            }
            throw err;
        });
    }
    public async has(key: string): Promise<boolean> {
        return this.storageAdapter.has(key);
    }
    public async set(key: string, value: V, encryptionKey: Buffer): Promise<void> {
        return this.storageAdapter.set(key, value, encryptionKey).catch((err: Error) => {
            const message = err.message?.toLowerCase() || '';
            if (message.includes('object has been deleted')) {
                this.logger?.info({ key }, 'Object has been deleted');

                return;
            }
            throw err;
        });
    }
    public async del(key: string): Promise<void> {
        return this.storageAdapter.delete(key);
    }
    public stop(): void {
        this.storageAdapter.stop();
    }
    public async shutdown(): Promise<void> {
        await this.storageAdapter.shutdown();
    }
}
