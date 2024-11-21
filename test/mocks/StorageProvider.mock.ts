import { Readable } from 'stream';
import IStorageProvider from '../../src/providers/storage/IStorageProvider.js';
import StorageObject from '../../src/types/storage/StorageObject.js';
import { mockReadStream } from './ReadStream.mock.js';

const DEFAULT_SIZE = 1;

export interface MockStorageProviderProps {
  storageObject: StorageObject;
}

export interface GetDefaultListObjectMockProps {
  name: string;
  createdAt?: Date;
}

export const getDefaultListObjectMock = (props: GetDefaultListObjectMockProps) => {
  const { name, createdAt } = props || {};

  return {
    name,
    size: DEFAULT_SIZE,
    createdAt: createdAt || new Date(),
  };
};

export default class MockStorageProvider implements IStorageProvider {
  private cache = new Map<string, { value: string; createdAt: Date; size: number }>();
  private async streamToString(stream: Readable): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let data = '';

      stream.on('data', (chunk) => {
        data += chunk;
      });

      stream.on('end', () => {
        resolve(data);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }
  public async uploadFile(
    inputStream: Readable,
    remotePath: string,
    // contentLength: number,
    // progressListener?: (total: number, current: number) => void,
  ): Promise<void> {
    const value = await this.streamToString(inputStream);
    this.cache.set(remotePath, {
      value,
      createdAt: new Date(),
      size: DEFAULT_SIZE,
    });
  }
  public async downloadFile(
    remotePath: string,
    // config: DownloadConfig,
    // progressListener?: (total: number, current: number) => void,
  ): Promise<Readable> {
    return mockReadStream(this.cache.get(remotePath)?.value);
  }
  public async deleteObject(remotePath: string): Promise<void> {
    this.cache.delete(remotePath);
  }
  public async listObjects(remotePath: string): Promise<StorageObject[]> {
    return [...this.cache.entries()]
      .filter(([key]) => key.startsWith(remotePath.replace('/', '')))
      .map(([key, value]) =>
        getDefaultListObjectMock({
          name: key,
          createdAt: value?.createdAt,
        }),
      );
  }
  public async getObjectSize(remotePath: string): Promise<number> {
    return this.cache.get(remotePath)?.size || 0;
  }
  public async getLastModified(remotePath: string): Promise<Date | null> {
    return this.cache.get(remotePath)?.createdAt || null;
  }
}
