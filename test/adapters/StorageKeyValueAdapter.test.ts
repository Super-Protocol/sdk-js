import StorageKeyValueAdapter from "../../src/providers/storage/StorageKeyValueAdapter";
import StorageProviderMock, { getDefaultListObjectMock } from "../mocks/StorageProvider.mock";
import { keyValueStorageAdapterConfig } from "./utls";

const data = { message: "I am a secret data!" };
const aesKey = "Bf+uvMpBdwr0JdS6m057zf9TIjfcqTHBkqNtlNtzB9Q=";

jest.mock(
    "../../src/providers/storage/getStorageProvider",
    jest.fn(() => () => new StorageProviderMock()),
);

describe("StorageKeyValueAdapter", () => {
    const storageKeyValueAdapter = new StorageKeyValueAdapter(keyValueStorageAdapterConfig, { showLogs: false });
    test("encrypt/decrypt", async () => {
        const encrypted = await storageKeyValueAdapter.encrypt(data, aesKey);
        const decrypted = await storageKeyValueAdapter.decrypt(encrypted, aesKey);
        expect(decrypted).toEqual(data);
        expect(encrypted).not.toContain(data);
    });
    describe("set/get/delete", () => {
        const key = "test-key";
        test("set", async () => {
            const result = await storageKeyValueAdapter.set(key, data, aesKey);
            expect(result).toEqual(undefined);
        });
        test("get", async () => {
            const result = await storageKeyValueAdapter.get(key, aesKey);
            expect(result).toEqual(data);
        });
        test("delete", async () => {
            await storageKeyValueAdapter.delete(key);
            const result = await storageKeyValueAdapter.get(key, aesKey);
            expect(result).toEqual(null);
        });
    });
    test("listFiles", async () => {
        const key = "test-key";
        await storageKeyValueAdapter.set(key, data, aesKey);
        const result = await storageKeyValueAdapter.listFiles(key);
        const createdAt = result?.[0]?.createdAt;
        expect(result).toEqual([
            getDefaultListObjectMock({
                name: key,
                createdAt: createdAt ? new Date(createdAt) : undefined,
            }),
        ]);
    });
});
