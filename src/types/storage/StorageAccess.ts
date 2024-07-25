import { StorageAccessCredentials, StorageType } from '@super-protocol/dto-js';

type StorageAccess<T extends StorageAccessCredentials = StorageAccessCredentials> = {
  storageType: StorageType;
  credentials: T;
  maximumConcurrent?: number;
};

export default StorageAccess;
