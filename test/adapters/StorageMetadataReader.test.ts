import StorageMetadataReader from '../../src/providers/storage/StorageMetadataReader.js';
import StorageKeyValueAdapter from '../../src/providers/storage/StorageKeyValueAdapter.js';
import StorageProviderMock from '../mocks/StorageProvider.mock.js';
import { CacheRecord } from '../../src/providers/storage/types.js';
import { keyValueStorageAdapterConfig, aesKey } from './utils.js';

interface Data {
  message: string;
}

const data = { message: 'I am a secret data!' };

jest.mock(
  '../../src/providers/storage/getStorageProvider',
  jest.fn(() => () => new StorageProviderMock()),
);

describe('StorageMetadataReader', () => {
  describe('fetchInstancesUpdates', () => {
    test('must be updated size', async () => {
      const key = 'test-key';
      const DEFAULT_DECREASE = 10000;
      const storageKeyValueAdapter = new StorageKeyValueAdapter<Data>(
        keyValueStorageAdapterConfig,
        { showLogs: false },
      );
      await storageKeyValueAdapter.set(key, data, aesKey);
      const cache = new Map<string, CacheRecord<Data>>();
      cache.set(key, {
        value: data,
        modifiedTs: new Date().getTime() - DEFAULT_DECREASE,
      });
      const storageMetadataReader = new StorageMetadataReader<string, Data>({
        storageKeyValueAdapter,
        objectDeletedFlag: 'deleted',
        showLogs: false,
      });
      const { updated } = await storageMetadataReader.fetchInstancesUpdates(key, cache);
      expect(updated.size).toEqual(1);
    });
    test('must be deleted size', async () => {
      const key = 'test-key';
      const storageKeyValueAdapter = new StorageKeyValueAdapter<Data>(
        keyValueStorageAdapterConfig,
        { showLogs: false },
      );
      const cache = new Map<string, CacheRecord<Data>>();
      cache.set(key, {
        value: data,
        modifiedTs: new Date().getTime(),
      });
      const storageMetadataReader = new StorageMetadataReader<string, Data>({
        storageKeyValueAdapter,
        objectDeletedFlag: 'deleted',
        showLogs: false,
      });
      const { deleted } = await storageMetadataReader.fetchInstancesUpdates(key, cache);
      expect(deleted.size).toEqual(1);
    });
    test('must be empty sizes', async () => {
      const key = 'test-key';
      const storageKeyValueAdapter = new StorageKeyValueAdapter<Data>(
        keyValueStorageAdapterConfig,
        { showLogs: false },
      );
      const cache = new Map<string, CacheRecord<Data>>();
      const storageMetadataReader = new StorageMetadataReader<string, Data>({
        storageKeyValueAdapter,
        objectDeletedFlag: 'deleted',
        showLogs: false,
      });
      const { deleted, updated } = await storageMetadataReader.fetchInstancesUpdates(key, cache);
      expect(deleted.size).toEqual(0);
      expect(updated.size).toEqual(0);
    });
  });
});
