import { Readable } from 'stream';
import { Encryption, ResourceType, StorageProviderResource } from '@super-protocol/dto-js';
import { StorageAccess, getStorageProvider } from '../../index.js';
import { isNodeJS } from '../helper.js';
import { OrderArgsHelper } from './OrderArgsHelper.js';

export type ReadWriteStorageAccess = {
  read: StorageAccess;
  write: StorageAccess;
};

export type UploadObjectToStoragePrams = {
  data: Record<string, unknown>;
  filepath: string;
  access: ReadWriteStorageAccess;
  encryption?: Encryption;
};

const string2Stream = (
  data: string,
): {
  stream: Readable | Blob;
  size: number;
} => {
  const buffer = Buffer.from(data);

  if (isNodeJS()) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    return {
      stream,
      size: buffer.length,
    };
  } else {
    const blob = new Blob([buffer]);

    return {
      stream: blob,
      size: blob.size,
    };
  }
};

export const uploadObjectToStorage = async (
  params: UploadObjectToStoragePrams,
): Promise<StorageProviderResource> => {
  const { data, access, filepath, encryption } = params;
  if (
    access.read.storageType !== access.write.storageType ||
    access.read.credentials.bucket !== access.write.credentials.bucket ||
    access.read.credentials.prefix !== access.write.credentials.prefix
  ) {
    throw new Error('Invalid storage access configuration');
  }

  const dataToUpload = encryption
    ? await OrderArgsHelper.encryptOrderArgs(data, encryption)
    : JSON.stringify(data);
  const dataForUpload = string2Stream(dataToUpload);
  const storageProvider = getStorageProvider(params.access.write);
  await storageProvider.uploadFile(dataForUpload.stream, filepath, dataForUpload.size);

  return {
    ...access.read,
    type: ResourceType.StorageProvider,
    filepath,
  };
};
