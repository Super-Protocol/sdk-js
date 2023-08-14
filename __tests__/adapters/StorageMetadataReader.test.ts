import StorageMetadataReader from "../../src/providers/storage/StorageMetadataReader";
import StorageKeyValueAdapter from "../../src/providers/storage/StorageKeyValueAdapter";
import StorageProviderMock from "../mocks/StorageProvider.mock";
import { CacheRecord } from "../../src/providers/storage/types";
import { keyValueStorageAdapterConfig } from "./utls";

interface Data {
    message: string;
}

const data = { message: "I am a secret data!" };
const aesKey = "Bf+uvMpBdwr0JdS6m057zf9TIjfcqTHBkqNtlNtzB9Q=";

jest.mock(
    "../../src/providers/storage/getStorageProvider",
    jest.fn(() => () => new StorageProviderMock()),
);

describe("StorageMetadataReader", () => {
    describe("fetchInstancesUpdates", () => {
        test("must be updated size", async () => {
            const key = "test-key";
            const storageKeyValueAdapter = new StorageKeyValueAdapter<Data>(keyValueStorageAdapterConfig);
            await storageKeyValueAdapter.set(key, data, aesKey);
            const DECREASE_DATE_TIME = 1000000;
            const cache = new Map<string, CacheRecord<Data>>();
            cache.set(key, {
                value: data,
                modifiedTs: new Date(new Date().valueOf() - DECREASE_DATE_TIME).getTime(),
            });
            const storageMetadataReader = new StorageMetadataReader<string, Data>({
                storageKeyValueAdapter,
                objectDeletedFlag: "deleted",
            });
            const { updated } = await storageMetadataReader.fetchInstancesUpdates(key, cache);
            expect(updated.size).toEqual(1);
        });
        test("must be updated size", async () => {
            const key = "test-key";
            const storageKeyValueAdapter = new StorageKeyValueAdapter<Data>(keyValueStorageAdapterConfig);
            await storageKeyValueAdapter.set(key, data, aesKey);
            const cache = new Map<string, CacheRecord<Data>>();
            const storageMetadataReader = new StorageMetadataReader<string, Data>({
                storageKeyValueAdapter,
                objectDeletedFlag: "deleted",
            });
            const { updated } = await storageMetadataReader.fetchInstancesUpdates(key, cache);
            expect(updated.size).toEqual(1);
        });
        test("must be deleted size", async () => {
            const key = "test-key";
            const storageKeyValueAdapter = new StorageKeyValueAdapter<Data>(keyValueStorageAdapterConfig);
            const cache = new Map<string, CacheRecord<Data>>();
            cache.set(key, {
                value: data,
                modifiedTs: new Date().getTime(),
            });
            const storageMetadataReader = new StorageMetadataReader<string, Data>({
                storageKeyValueAdapter,
                objectDeletedFlag: "deleted",
            });
            const { deleted } = await storageMetadataReader.fetchInstancesUpdates(key, cache);
            expect(deleted.size).toEqual(1);
        });
        test("must be empty sizes", async () => {
            const key = "test-key";
            const storageKeyValueAdapter = new StorageKeyValueAdapter<Data>(keyValueStorageAdapterConfig);
            const cache = new Map<string, CacheRecord<Data>>();
            const storageMetadataReader = new StorageMetadataReader<string, Data>({
                storageKeyValueAdapter,
                objectDeletedFlag: "deleted",
            });
            const { deleted, updated } = await storageMetadataReader.fetchInstancesUpdates(key, cache);
            expect(deleted.size).toEqual(0);
            expect(updated.size).toEqual(0);
        });
    });
});
