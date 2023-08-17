import { LRUCache } from "lru-cache";
import StorageContentWriter, { ContentWriterType, StorageContentWriterConfig } from "../../src/providers/storage/StorageContentWriter";
import { CacheRecord } from "../../src/providers/storage/types";
import StorageKeyValueAdapter from "../../src/providers/storage/StorageKeyValueAdapter";
import StorageProviderMock from "../mocks/StorageProvider.mock";
import { keyValueStorageAdapterConfig, aesKey } from "./utils";
import { sleep } from "../utils";

interface Data {
    message: string;
}
const config: StorageContentWriterConfig<Data> = {
    interval: 1,
    storageKeyValueAdapter: new StorageKeyValueAdapter<Data>(keyValueStorageAdapterConfig, { showLogs: false }),
    instanceId: "test-instance-id",
    objectDeletedFlag: "deleted",
    writeContentConcurrency: 1,
    showLogs: false,
};

jest.mock(
    "../../src/providers/storage/getStorageProvider",
    jest.fn(() => () => new StorageProviderMock()),
);

describe("StorageContentWriter", () => {
    test("set/get/clear", async () => {
        const key = "123";
        const storageContentWriter = new StorageContentWriter(config);
        storageContentWriter.set(key, ContentWriterType.NEEDS_UPLOAD, aesKey);
        expect(storageContentWriter.get(key)).toEqual(ContentWriterType.NEEDS_UPLOAD);
        storageContentWriter.clear();
        expect(storageContentWriter.get(key)).toEqual(null);
    });
    test("startActualizeCacheTimer/stop/shutdown", async () => {
        const key1 = "1";
        const key2 = "2";
        const cache = new LRUCache<string, Map<string, CacheRecord<Data>>>({ max: 500 });
        const storageContentWriter = new StorageContentWriter<string, Data>(config);
        storageContentWriter.startActualizeCacheTimer(cache);
        storageContentWriter.set(key1, ContentWriterType.NEEDS_UPLOAD, aesKey);
        storageContentWriter.set(key2, ContentWriterType.NEEDS_UPLOAD, aesKey);
        expect(storageContentWriter.get(key1)).toEqual(ContentWriterType.NEEDS_UPLOAD);
        expect(storageContentWriter.get(key2)).toEqual(ContentWriterType.NEEDS_UPLOAD);
        await sleep(1);
        expect(storageContentWriter.get(key1)).toEqual(null);
        expect(storageContentWriter.get(key2)).toEqual(null);
        storageContentWriter.stop();
        storageContentWriter.set(key1, ContentWriterType.NEEDS_UPLOAD, aesKey);
        storageContentWriter.set(key2, ContentWriterType.NEEDS_UPLOAD, aesKey);
        expect(storageContentWriter.get(key1)).toEqual(ContentWriterType.NEEDS_UPLOAD);
        expect(storageContentWriter.get(key2)).toEqual(ContentWriterType.NEEDS_UPLOAD);
        await sleep(1);
        storageContentWriter.clear();
        expect(storageContentWriter.get(key1)).toEqual(null);
        expect(storageContentWriter.get(key2)).toEqual(null);
        storageContentWriter.startActualizeCacheTimer(cache);
        storageContentWriter.set(key1, ContentWriterType.NEEDS_DELETE, aesKey);
        await sleep(1);
        expect(storageContentWriter.get(key1)).toEqual(null);
        storageContentWriter.stop();
        storageContentWriter.startActualizeCacheTimer(cache);
        storageContentWriter.set(key1, ContentWriterType.NEEDS_DELETE, aesKey);
        await storageContentWriter.shutdown(cache);
        expect(storageContentWriter.get(key1)).toEqual(null);
    });
});
