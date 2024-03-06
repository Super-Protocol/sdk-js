import StorjAdapter, { StorjConfig } from '../../src/providers/storage/StorjAdapter.js';
import StorageProviderMock from '../mocks/StorageProvider.mock.js';
import { keyValueStorageAdapterConfig, bufferAesKey } from './utils.js';
import { sleep } from '../utils.js';

interface Data {
  message: string;
}
const storageAccessConfig = {
  ...keyValueStorageAdapterConfig,
};
const config: StorjConfig = {
  lruCache: {
    max: 500,
  },
  writeInterval: 1,
  readInterval: 1,
  objectDeletedFlag: 'deleted',
  showLogs: false,
};
let storageProviderMockInstance: StorageProviderMock;

jest.mock(
  '../../src/providers/storage/getStorageProvider',
  jest.fn(() => () => storageProviderMockInstance),
);

describe('StorjAdapter', () => {
  beforeEach(() => {
    storageProviderMockInstance = new StorageProviderMock();
  });
  test('multiple instances', async () => {
    let storjAdapter1;
    let storjAdapter2;
    try {
      const key1 = 'test-key-1';
      const key2 = 'test-key-2';
      const key3 = 'test-key-3';
      const key4 = 'test-key-4';
      const key5 = 'test-key-5';
      const data1 = { message: 'I am a first secret data!' };
      const data2 = { message: 'I am a second secret data!' };
      storjAdapter1 = new StorjAdapter<Data>(storageAccessConfig, config);
      storjAdapter2 = new StorjAdapter<Data>(storageAccessConfig, config);
      await storjAdapter1.set(key1, data1, bufferAesKey);
      await storjAdapter1.set(key2, data1, bufferAesKey);
      await sleep(1);
      expect(await storjAdapter1.get(key1, bufferAesKey)).toEqual([data1]);
      expect(await storjAdapter2.get(key1, bufferAesKey)).toEqual([null, data1]);
      await storjAdapter1.del(key2);
      expect(await storjAdapter1.has(key1)).toEqual(true);
      expect(await storjAdapter2.has(key1)).toEqual(true);
      expect(await storjAdapter1.has(key2)).toEqual(false);
      expect(await storjAdapter2.has(key2)).toEqual(true);
      await sleep(1);
      expect(await storjAdapter1.has(key1)).toEqual(true);
      expect(await storjAdapter2.has(key1)).toEqual(true);
      expect(await storjAdapter1.has(key2)).toEqual(false);
      expect(await storjAdapter2.has(key2)).toEqual(false);
      await storjAdapter2.set(key3, data1, bufferAesKey);
      expect(await storjAdapter1.has(key3)).toEqual(false);
      expect(await storjAdapter2.has(key3)).toEqual(true);
      await sleep(1);
      expect(await storjAdapter1.has(key3)).toEqual(true);
      expect(await storjAdapter2.has(key3)).toEqual(true);
      await storjAdapter2.set(key4, data2, bufferAesKey);
      expect(await storjAdapter1.get(key4, bufferAesKey)).toEqual(null);
      expect(await storjAdapter2.get(key4, bufferAesKey)).toEqual([data2]);
      await sleep(1);
      expect(await storjAdapter1.get(key4, bufferAesKey)).toEqual([null, data2]);
      expect(await storjAdapter2.get(key4, bufferAesKey)).toEqual([data2]);
      await storjAdapter1.set(key5, data1, bufferAesKey);
      expect(await storjAdapter1.get(key5, bufferAesKey)).toEqual([data1]);
    } finally {
      storjAdapter1?.stop();
      storjAdapter2?.stop();
    }
  });
});
