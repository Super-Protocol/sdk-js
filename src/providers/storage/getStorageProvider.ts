import { FSCredentials, S3Credentials, StorageType } from '@super-protocol/dto-js';
import StorageAccess from '../../types/storage/StorageAccess.js';
import IStorageProvider from './IStorageProvider.js';
import StorjStorageProvider from './StorjStorageProvider.js';
import { S3StorageProvider } from './S3StorageProvider.js';
import { FSStorageProvider } from './fs-storage-provider.js';

export default (storageAccess: StorageAccess): IStorageProvider => {
  const key = storageAccess.storageType as StorageType;
  switch (key) {
    case StorageType.StorJ:
      return new StorjStorageProvider(storageAccess.credentials, storageAccess.maximumConcurrent);
    case StorageType.S3:
      return new S3StorageProvider(storageAccess.credentials as S3Credentials);
    case StorageType.FS:
      return new FSStorageProvider(storageAccess.credentials as FSCredentials);
    default:
      throw Error(`Unsupported storageType ${key}`);
  }
};
