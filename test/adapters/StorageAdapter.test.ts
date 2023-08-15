import StorageAdapter, { StorageAdapterConfig, CacheEvents } from "../../src/providers/storage/StorageAdapter";
import StorageProviderMock from "../mocks/StorageProvider.mock";
import { keyValueStorageAdapterConfig, bufferAesKey } from "./utils";
import { sleep } from "../utils";

interface Data {
    message: string;
}
const storageAccessConfig = {
    ...keyValueStorageAdapterConfig,
};
const config: StorageAdapterConfig = {
    lruCache: {
        max: 500,
    },
    writeInterval: 1,
    readInterval: 1,
    objectDeletedFlag: "deleted",
    showLogs: false,
};
let storageProviderMockInstance: StorageProviderMock;

jest.mock(
    "../../src/providers/storage/getStorageProvider",
    jest.fn(() => () => storageProviderMockInstance),
);

describe("StorageAdapter", () => {
    beforeEach(() => {
        storageProviderMockInstance = new StorageProviderMock();
    });
    test("one instance", async () => {
        let storageAdapter;
        try {
            const key1 = "test-key-1";
            const key2 = "test-key-2";
            const key3 = "test-key-3";
            const data = { message: "I am a secret data!" };
            storageAdapter = new StorageAdapter<Data>(storageAccessConfig, config);
            storageAdapter.run();
            await storageAdapter.set(key1, data, bufferAesKey);
            expect(await storageAdapter.get(key1, bufferAesKey)).toEqual([data]);
            await storageAdapter.set(key2, data, bufferAesKey);
            await storageAdapter.set(key3, data, bufferAesKey);
            expect(await storageAdapter.get(key2, bufferAesKey)).toEqual([data]);
            await storageAdapter.delete(key1);
            expect(await storageAdapter.has(key1)).toEqual(false);
            expect(await storageAdapter.has(key2)).toEqual(true);
            await sleep(10);
            expect(await storageAdapter.has(key1)).toEqual(false);
            expect(await storageAdapter.has(key2)).toEqual(true);
        } finally {
            storageAdapter?.stop();
        }
    });
    test("multiple instances", async () => {
        let storageAdapter1;
        let storageAdapter2;
        try {
            const key1 = "test-key-1";
            const key2 = "test-key-2";
            const key3 = "test-key-3";
            const key4 = "test-key-4";
            const key5 = "test-key-5";
            const key6 = "test-key-6";
            const key7 = "test-key-7";
            const data1 = { message: "I am a first secret data!" };
            const data2 = { message: "I am a second secret data!" };
            let subscribeAdapter1 = { delete: 0 };
            let subscribeAdapter2 = { delete: 0 };
            storageAdapter1 = new StorageAdapter<Data>(storageAccessConfig, config);
            storageAdapter2 = new StorageAdapter<Data>(storageAccessConfig, config);
            const storageAdapter1Subscriber = await storageAdapter1.subscribe(({ type }) => {
                if (type === CacheEvents.KEY_DELETED) {
                    subscribeAdapter1.delete += 1;
                }
            });
            const storageAdapter2Subscriber = await storageAdapter2.subscribe(({ type }) => {
                if (type === CacheEvents.KEY_DELETED) {
                    subscribeAdapter2.delete += 1;
                }
            });
            storageAdapter1.run();
            storageAdapter2.run();
            await storageAdapter1.set(key1, data1, bufferAesKey);
            await storageAdapter1.set(key2, data1, bufferAesKey);
            await sleep(1);
            expect(await storageAdapter1.get(key1, bufferAesKey)).toEqual([data1]);
            expect(await storageAdapter2.get(key1, bufferAesKey)).toEqual([null, data1]);
            await storageAdapter1.delete(key2);
            expect(await storageAdapter1.has(key1)).toEqual(true);
            expect(await storageAdapter2.has(key1)).toEqual(true);
            expect(await storageAdapter1.has(key2)).toEqual(false);
            expect(await storageAdapter2.has(key2)).toEqual(true);
            await sleep(1);
            expect(await storageAdapter1.has(key1)).toEqual(true);
            expect(await storageAdapter2.has(key1)).toEqual(true);
            expect(await storageAdapter1.has(key2)).toEqual(false);
            expect(await storageAdapter2.has(key2)).toEqual(false);
            await storageAdapter2.set(key3, data1, bufferAesKey);
            expect(await storageAdapter1.has(key3)).toEqual(false);
            expect(await storageAdapter2.has(key3)).toEqual(true);
            await sleep(1);
            expect(await storageAdapter1.has(key3)).toEqual(true);
            expect(await storageAdapter2.has(key3)).toEqual(true);
            await storageAdapter2.set(key4, data2, bufferAesKey);
            expect(await storageAdapter1.get(key4, bufferAesKey)).toEqual(null);
            expect(await storageAdapter2.get(key4, bufferAesKey)).toEqual([data2]);
            await sleep(1);
            expect(await storageAdapter1.get(key4, bufferAesKey)).toEqual([null, data2]);
            expect(await storageAdapter2.get(key4, bufferAesKey)).toEqual([data2]);
            await storageAdapter1.set(key5, data1, bufferAesKey);
            expect(await storageAdapter1.get(key5, bufferAesKey)).toEqual([data1]);
            await storageAdapter1.clear();
            expect(await storageAdapter1.get(key5, bufferAesKey)).toEqual(null);
            await storageAdapter1.set(key6, data1, bufferAesKey);
            await storageAdapter1.shutdown();
            expect(await storageAdapter1.get(key6, bufferAesKey)).toEqual([data1]);
            expect(await storageAdapter2.get(key6, bufferAesKey)).toEqual([null, data1]);
            await storageAdapter1.set(key7, data1, bufferAesKey);
            expect(await storageAdapter1.get(key7, bufferAesKey)).toEqual([data1]);
            expect(await storageAdapter2.get(key7, bufferAesKey)).toEqual(null);
            await storageAdapter1.run();
            await sleep(1);
            expect(await storageAdapter2.get(key7, bufferAesKey)).toEqual([null, data1]);
            await storageAdapter1.clear();
            await storageAdapter2.clear();
            expect(await storageAdapter2.get(key7, bufferAesKey)).toEqual([null, data1]);
            await storageAdapter1.shutdown();
            await storageAdapter2.shutdown();
            expect(!!subscribeAdapter1.delete).toBeTruthy();
            expect(!!subscribeAdapter2.delete).toBeTruthy();
            await storageAdapter1Subscriber();
            await storageAdapter2Subscriber();
        } finally {
            storageAdapter1?.stop();
            storageAdapter2?.stop();
        }
    });
});
