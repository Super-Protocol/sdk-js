import _ from 'lodash';
import {
  Encoding,
  Encryption,
  Hash,
  HashAlgorithm,
  StorageProviderResource,
  TeeOrderEncryptedArgs,
} from '@super-protocol/dto-js';
import Crypto from '../../crypto/index.js';
import StorageAccess from '../../types/storage/StorageAccess.js';
import { uploadObjectToStorage } from './uploadObjectToStorage.js';

const isStringArray = (item: unknown): item is string[] =>
  Array.isArray(item) && item.every(_.isString);

const isEncryptedData = (arg: unknown): boolean => {
  if (!_.isString(arg)) {
    return false;
  }

  try {
    const encryption: Encryption = JSON.parse(arg);

    return Boolean(encryption.encoding && encryption.algo && encryption.ciphertext);
  } catch {
    return false;
  }
};

const isEncryptedArgs = (arg: NonNullable<Record<string, unknown>>): boolean =>
  Boolean(
    _.isPlainObject(arg) &&
      isStringArray(arg.data) &&
      isStringArray(arg.image) &&
      isStringArray(arg.solution) &&
      (!arg.configuration || isEncryptedData(arg.configuration)),
  );

const sortArrayByHash = async (array: string[]): Promise<string[]> => {
  const elementsWithHashes = await Promise.all(
    array.map(async (element) => {
      const hashObj = await Crypto.createHash(Buffer.from(element), {
        algo: HashAlgorithm.SHA256,
        encoding: Encoding.hex,
      });

      return { element, hash: hashObj.hash };
    }),
  );

  return _.chain(elementsWithHashes).sortBy(['hash']).map('element').value();
};

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

  static isMoreThanGivenSize(args: Record<string, unknown>, sizeInBytes = 2.5 * 1024): boolean {
    const serializedData = JSON.stringify(args);
    const encoder = new TextEncoder();
    const data = encoder.encode(serializedData);

    return data.length > sizeInBytes;
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

  static async calculateArgsHash(args: TeeOrderEncryptedArgs): Promise<Hash> {
    const entries = Object.entries(args);
    const resultObject: Record<string, unknown> = {};
    for (const [key, value] of _.sortBy(entries, [0])) {
      if (isStringArray(value) && value.length > 1) {
        resultObject[key] = await sortArrayByHash(value as string[]);
      }
    }

    return Crypto.createHash(Buffer.from(JSON.stringify(resultObject)), {
      algo: HashAlgorithm.SHA256,
      encoding: Encoding.hex,
    });
  }
}
