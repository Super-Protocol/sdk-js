import _ from 'lodash';
import { Readable } from 'stream';
import { Encryption, ResourceType, StorageProviderResource } from '@super-protocol/dto-js';
import Crypto from '../../crypto/index.js';
import getStorageProvider from '../../providers/storage/getStorageProvider.js';
import StorageAccess from '../../types/storage/StorageAccess.js';

// TODO: @super-protocol/dto-js
type TeeOrderEncryptedArgsConfiguration = {
  solution: Record<string, unknown>;
  data: Array<Record<string, unknown>>;
};

// TODO: @super-protocol/dto-js
export type TeeOrderEncryptedArgs = {
  data: string[];
  image: string[];
  solution: string[];
  configuration?: Partial<TeeOrderEncryptedArgsConfiguration>;
};

const isStringArray = (item: unknown): item is string[] =>
  Array.isArray(item) && item.every(_.isString);

const isEncryptedArgsConfiguration = (
  arg: Record<string, unknown>,
): arg is TeeOrderEncryptedArgsConfiguration =>
  Boolean(_.isPlainObject(arg) && isStringArray(arg.data) && _.isPlainObject(arg.solution));

const isEncryptedArgs = (arg: NonNullable<Record<string, unknown>>): arg is TeeOrderEncryptedArgs =>
  Boolean(
    _.isPlainObject(arg) &&
      isStringArray(arg.data) &&
      isStringArray(arg.image) &&
      isStringArray(arg.solution) &&
      (!arg.configuration ||
        isEncryptedArgsConfiguration(arg.configuration as Record<string, unknown>)),
  );

export class OrderArgsHelper {
  static async decryptOrderArgs<T>(
    encryptedArgs: string,
    ecdhPrivateKey: string,
  ): Promise<T | undefined> {
    if (!encryptedArgs) {
      return;
    }

    const encrypted: Encryption = JSON.parse(encryptedArgs);
    encrypted.key = ecdhPrivateKey;

    const decryptedArgsStr = await Crypto.decrypt(encrypted);
    const orderArguments = JSON.parse(decryptedArgsStr);

    return orderArguments as T;
  }

  static async encryptOrderArgs(args: unknown, encryption: Encryption): Promise<string> {
    const encryptedArgs = await Crypto.encrypt(JSON.stringify(args), encryption);

    return JSON.stringify(encryptedArgs);
  }

  static hasMoreThanGivenElements(
    args: Partial<TeeOrderEncryptedArgs>,
    elementsCount = 2,
  ): boolean {
    let totalElements = 0;
    const inc = (data: Array<unknown> | undefined): void => {
      totalElements += data?.length ?? 0;
    };

    inc(args.solution);
    inc(args.data);
    inc(args.image);
    inc(args.configuration?.data);
    totalElements += args.configuration?.solution ? 1 : 0;

    return totalElements > elementsCount;
  }

  static async uploadToStorage(params: {
    args: TeeOrderEncryptedArgs;
    key: string;
    access: {
      read: StorageAccess;
      write: StorageAccess;
    };
    encryption: Encryption;
  }): Promise<StorageProviderResource> {
    const { access, args, key, encryption } = params;
    if (
      access.read.storageType !== access.write.storageType ||
      access.read.credentials.bucket !== access.write.credentials.bucket ||
      access.read.credentials.prefix !== access.write.credentials.prefix
    ) {
      throw new Error('Invalid storage access configuration');
    }
    if (!isEncryptedArgs(args)) {
      throw new Error('Invalid args for uploading');
    }

    const string2Stream = (
      data: string,
    ): {
      stream: Readable;
      size: number;
    } => {
      const buffer = Buffer.from(data);
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      return {
        stream,
        size: buffer.length,
      };
    };

    const encryptedData = await OrderArgsHelper.encryptOrderArgs(args, encryption);
    const dataForUpload = string2Stream(encryptedData);
    const storageProvider = getStorageProvider(params.access.write);
    await storageProvider.uploadFile(dataForUpload.stream, key, dataForUpload.size);

    return {
      ...access.read,
      type: ResourceType.StorageProvider,
      filepath: key,
    };
  }
}
