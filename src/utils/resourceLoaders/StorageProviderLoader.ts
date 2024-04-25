import fs from 'fs';
import stream from 'stream';
import { Resource, ResourceType, StorageProviderResource } from '@super-protocol/dto-js';
import {
  createDownloadChunkMethodWithRetry,
  downloadChunkMethod,
  DownloadDecorator,
  RetryDownloadChunkOptions,
} from '../../providers/storage/ChunksDownloadDecorator.js';
import { IResourceLoader, ResourceLoaderConfig } from '../../types/ResourceLoader.js';
import getStorageProvider from '../../providers/storage/getStorageProvider.js';
import IStorageProvider from '../../providers/storage/IStorageProvider.js';
import { BaseResourceLoader } from './BaseResourceLoader.js';

export class StorageProviderLoader extends BaseResourceLoader implements IResourceLoader {
  private static DEFAULT_RETRY_COUNT = 3;
  private static DEFAULT_START_OFFSET = 0;

  public static type = ResourceType.StorageProvider;
  private progressListener?: (total: number, current: number) => void;
  private chunkSize?: number;
  private concurrency?: number;
  private startOffset: number;
  private retry: RetryDownloadChunkOptions;

  constructor(config: ResourceLoaderConfig = {}) {
    super();
    this.progressListener = config.progressListener;
    this.chunkSize = config.chunkSize;
    this.concurrency = config.concurrency;
    this.startOffset = config.startOffset || StorageProviderLoader.DEFAULT_START_OFFSET;
    this.retry = {
      retryMaxCount: config.retry?.retryMaxCount || StorageProviderLoader.DEFAULT_RETRY_COUNT,
      onRetry: config.retry?.onRetry,
      retryWaitTimeFactory: config.retry?.retryWaitTimeFactory,
    };
  }

  public async download(resource: Resource): Promise<Buffer> {
    const downloadStream = await this.getFileStream(resource as StorageProviderResource);

    return this.downloadToBuffer(downloadStream);
  }

  public async downloadToFile(resource: Resource, downloadPath: string): Promise<void> {
    const downloadStream = await this.getFileStream(resource as StorageProviderResource);

    await stream.promises.pipeline(downloadStream, fs.createWriteStream(downloadPath));
  }

  private getFileStream(resource: StorageProviderResource): Promise<stream.Readable> {
    const storageProvider = getStorageProvider(resource);

    let storageProviderToInvoke: IStorageProvider;

    if (this.chunkSize && this.concurrency) {
      const chunkedDownloadWithRetry = createDownloadChunkMethodWithRetry(
        downloadChunkMethod,
        this.retry,
      );

      storageProviderToInvoke = new DownloadDecorator(storageProvider, chunkedDownloadWithRetry, {
        chunkSize: this.chunkSize,
        concurrency: this.concurrency,
        offset: this.startOffset,
      });
    } else {
      storageProviderToInvoke = storageProvider;
    }

    return storageProviderToInvoke.downloadFile(resource.filepath, {}, this.progressListener);
  }
}
