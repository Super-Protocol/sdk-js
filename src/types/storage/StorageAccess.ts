import { StorageAccessCredentials, StorageType } from '@super-protocol/dto-js';

type StorageAccess = {
  storageType: StorageType;
  credentials: StorageAccessCredentials;
  maximumConcurrent?: number;
};

export default StorageAccess;
