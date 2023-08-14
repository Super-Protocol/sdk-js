import StorageAdapter, { StorageAdapterConfig } from "../../src/providers/storage/StorageAdapter";
import StorageProviderMock from "../mocks/StorageProvider.mock";
import { keyValueStorageAdapterConfig } from "./utls";
import { sleep } from "../utils";

interface Data {
    message: string;
}
const aesKey = "Bf+uvMpBdwr0JdS6m057zf9TIjfcqTHBkqNtlNtzB9Q=";
const bufferAesKey = Buffer.from(aesKey, "base64");
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
            const data1 = { message: "I am a first secret data!" };
            const data2 = { message: "I am a second secret data!" };
            storageAdapter1 = new StorageAdapter<Data>(storageAccessConfig, config);
            storageAdapter2 = new StorageAdapter<Data>(storageAccessConfig, config);
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
        } finally {
            storageAdapter1?.stop();
            storageAdapter2?.stop();
        }
    });
});
