import _ from 'lodash';
import {
  Encryption,
  StorageProviderResource,
  TeeOrderEncryptedArgs,
  TeeOrderEncryptedArgsConfiguration,
} from '@super-protocol/dto-js';
import Crypto from '../../crypto/index.js';
import StorageAccess from '../../types/storage/StorageAccess.js';
import { uploadObjectToStorage } from './uploadObjectToStorage.js';

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

  static uploadToStorage(params: {
    args: TeeOrderEncryptedArgs;
    key: string;
    access: {
      read: StorageAccess;
      write: StorageAccess;
    };
    encryption: Encryption;
  }): Promise<StorageProviderResource> {
    const { access, args, key, encryption } = params;

    if (!isEncryptedArgs(args)) {
      throw new Error('Invalid args for uploading');
    }

    return uploadObjectToStorage({
      data: args,
      filepath: key,
      access,
      encryption,
    });
  }
}
