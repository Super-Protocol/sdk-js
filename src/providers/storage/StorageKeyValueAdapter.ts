import { Readable } from 'stream';
import { Encryption, CryptoAlgorithm, Encoding, Cipher } from '@super-protocol/dto-js';
import StorageAccess from '../../types/storage/StorageAccess.js';
import StorageObject from '../../types/storage/StorageObject.js';
import getStorageProvider from './getStorageProvider.js';
import IStorageProvider from './IStorageProvider.js';
import logger, { Logger } from '../../logger.js';
import Crypto from '../../crypto/Crypto.js';
import { IStorageKeyValueAdapter } from './types.js';

export interface StorageKeyValueAdapterConfig {
  showLogs?: boolean;
  hasEncryption?: boolean;
}

export default class StorageKeyValueAdapter<V extends object>
  implements IStorageKeyValueAdapter<V>
{
  private readonly hasEncryption: boolean;
  private readonly storageProvider: IStorageProvider;
  private readonly logger?: Logger | null;

  constructor(storageAccess: StorageAccess, config?: StorageKeyValueAdapterConfig) {
    if (!storageAccess?.credentials) {
      throw new Error('Credentials is empty');
    }
    const { showLogs = true, hasEncryption = true } = config || {};
    this.hasEncryption = hasEncryption;
    this.logger = showLogs ? logger.child({ class: StorageKeyValueAdapter.name }) : null;
    this.storageProvider = getStorageProvider(storageAccess);
  }

  protected async decrypt(encryption: Encryption, key: string): Promise<V | null> {
    if (!encryption) {
      return null;
    }
    if (!key) {
      throw new Error('Key cannot be empty!');
    }

    encryption.key = key;

    return JSON.parse(await Crypto.decrypt(encryption));
  }

  protected encrypt(data: V | null, key: string): Promise<Encryption> {
    if (data === undefined) {
      throw new Error('Data cannot be empty!');
    }
    if (!key) {
      throw new Error('Private cannot be empty!');
    }

    return Crypto.encrypt(JSON.stringify(data), {
      algo: CryptoAlgorithm.AES,
      encoding: Encoding.base64,
      key,
      cipher: Cipher.AES_256_GCM,
    });
  }

  private async downloadFromStorage(filepath: string): Promise<string> {
    const downloadStream = await this.storageProvider.downloadFile(filepath, {});

    return this.streamToString(downloadStream);
  }

  private streamToString(stream: Readable): Promise<string> {
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
  }

  private async storageUpload(key: string, value: V | null, privateKey?: string): Promise<void> {
    if (this.hasEncryption && !privateKey) {
      throw new Error('Invalid private key');
    }

    try {
      const encryptedValue =
        this.hasEncryption && privateKey ? await this.encrypt(value, privateKey) : value;
      const buffer = Buffer.from(JSON.stringify(encryptedValue));
      await this.storageProvider.uploadFile(Readable.from(buffer), key, buffer.byteLength);
      this.logger?.info({ data: key }, 'Success uploading to storage');
    } catch (err) {
      this.logger?.error({ err }, 'Error uploading to storage');
      throw err;
    }
  }

  private async storageDelete(key: string): Promise<void> {
    try {
      await this.storageProvider.deleteObject(key);
      this.logger?.info({ data: key }, 'Success deleting from storage');
    } catch (err) {
      this.logger?.info({ err }, 'Error deleting from storage');
      throw err;
    }
  }

  private async storageDownload(key: string, privateKey?: string): Promise<V | null> {
    if (this.hasEncryption && !privateKey) {
      throw new Error('Invalid private key');
    }

    try {
      const downloaded = await this.downloadFromStorage(key);
      this.logger?.info({ key }, 'Success download data from storage');

      if (!downloaded) {
        return null;
      }

      const value = JSON.parse(downloaded);

      return this.hasEncryption && privateKey ? await this.decrypt(value, privateKey) : value;
    } catch (err) {
      this.logger?.info(
        {
          err,
          key,
        },
        'Error download data from storage',
      );
      throw err;
    }
  }

  private async storageListFiles(key: string): Promise<StorageObject[]> {
    try {
      const listObjects = await this.storageProvider.listObjects(key);
      this.logger?.trace(
        {
          data: listObjects,
          key,
        },
        'Success list objects from storage',
      );

      return listObjects.filter((obj) => !obj.isFolder);
    } catch (err) {
      this.logger?.info(
        {
          err,
          key,
        },
        'Error list objects from storage',
      );
      throw err;
    }
  }

  set(key: string, value: V | null, privateKey?: string): Promise<void> {
    return this.storageUpload(key, value, privateKey);
  }

  delete(key: string): Promise<void> {
    return this.storageDelete(key);
  }

  get(key: string, privateKey?: string): Promise<V | null> {
    return this.storageDownload(key, privateKey);
  }

  listFiles(key: string): Promise<StorageObject[]> {
    return this.storageListFiles(key);
  }
}
