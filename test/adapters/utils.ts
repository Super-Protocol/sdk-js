import { S3Credentials, StorageType, StorjCredentials } from '@super-protocol/dto-js';
import { StorageAccess } from '../../src/index.js';

export const S3StorageAdapterConfig: StorageAccess<S3Credentials> = {
  storageType: StorageType.S3,
  credentials: {
    accessKeyId: 'test-access-key-id',
    secretKey: 'test-secret-access-key',
    endpoint: '/',
    bucket: 'test-bucket',
    prefix: '',
  },
};

export const StorJStorageAdapterConfig: StorageAccess<StorjCredentials> = {
  storageType: StorageType.S3,
  credentials: {
    token: 'test-access-token',
    bucket: 'test-bucket',
    prefix: '',
  },
  maximumConcurrent: 1,
};

export const aesKey = 'Bf+uvMpBdwr0JdS6m057zf9TIjfcqTHBkqNtlNtzB9Q=';
export const bufferAesKey = Buffer.from(aesKey, 'base64');
