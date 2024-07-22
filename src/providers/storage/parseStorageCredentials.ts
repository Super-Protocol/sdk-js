/* eslint-disable prettier/prettier */
import { StorageAccessCredentials } from '@super-protocol/dto-js';
import {
  S3Credentials,
  StorageCredentials,
  StorageType,
  StorjCredentials,
} from '@super-protocol/dto-js';

type StorageCredentialsType<T extends StorageType | unknown > =
    T extends StorageType.StorJ ? StorageCredentials<StorjCredentials> :
    T extends StorageType.S3 ? StorageCredentials<S3Credentials>:
    StorageCredentials<StorageAccessCredentials>;

export const parseStorageCredentials = <T extends StorageType | unknown = unknown>(
  decryptedCredentials: string,
): StorageCredentialsType<T> => {
  const credentials: StorageCredentials<string> = JSON.parse(decryptedCredentials);

  return {
    storageType: credentials.storageType,
    downloadCredentials: JSON.parse(credentials.downloadCredentials),
    uploadCredentials: JSON.parse(credentials.uploadCredentials),
  } as StorageCredentialsType<T>;
};
