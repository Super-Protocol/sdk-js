import StorageKeyValueAdapter from '../../src/providers/storage/StorageKeyValueAdapter.js';
import StorageProviderMock, { getDefaultListObjectMock } from '../mocks/StorageProvider.mock.js';
import { S3StorageAdapterConfig, aesKey } from './utils.js';
import { IStorageProvider } from '../../src/index.js';

const data = { message: 'I am a secret data!' };

jest.mock(
  '../../src/providers/storage/getStorageProvider',
  jest.fn(() => (): IStorageProvider => new StorageProviderMock()),
);

describe('StorageKeyValueAdapter', () => {
  const storageKeyValueAdapter = new StorageKeyValueAdapter(S3StorageAdapterConfig, {
    showLogs: false,
  });
  test('encrypt/decrypt', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const encrypted = await (storageKeyValueAdapter as any).encrypt(data, aesKey);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decrypted = await (storageKeyValueAdapter as any).decrypt(encrypted, aesKey);
    expect(decrypted).toEqual(data);
    expect(encrypted).not.toContain(data);
  });
  describe('set/get/delete', () => {
    const key = 'test-key';
    test('set', async () => {
      const result = await storageKeyValueAdapter.set(key, data, aesKey);
      expect(result).toEqual(undefined);
    });
    test('get', async () => {
      const result = await storageKeyValueAdapter.get(key, aesKey);
      expect(result).toEqual(data);
    });
    test('delete', async () => {
      await storageKeyValueAdapter.delete(key);
      const result = await storageKeyValueAdapter.get(key, aesKey);
      expect(result).toEqual(null);
    });
  });
  test('listFiles', async () => {
    const key = 'test-key';
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
