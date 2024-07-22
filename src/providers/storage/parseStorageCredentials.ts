/* eslint-disable prettier/prettier */
import {
  S3Credentials,
  StorageCredentials,
  StorageType,
  StorjCredentials,
} from '@super-protocol/dto-js';

type StorageCredentialsType<T extends StorageType> =
    T extends StorageType.StorJ ? StorageCredentials<StorjCredentials> :
    T extends StorageType.S3 ? StorageCredentials<S3Credentials>:
    never;

export const parseStorageCredentials = <T extends StorageType = StorageType.StorJ>(
  decryptedCredentials: string,
): StorageCredentialsType<T> => {
  const credentials: StorageCredentials = JSON.parse(decryptedCredentials);

  return {
    storageType: credentials.storageType,
    downloadCredentials: JSON.parse(credentials.downloadCredentials),
    uploadCredentials: JSON.parse(credentials.uploadCredentials),
  } as StorageCredentialsType<T>;
};
