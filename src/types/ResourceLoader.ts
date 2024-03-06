import { Resource, ResourceType } from '@super-protocol/dto-js';
import { RetryDownloadChunkOptions } from '../providers/storage/ChunksDownloadDecorator.js';

export interface ResourceLoaderConfig {
  progressListener?: (total: number, current: number) => void;
  chunkSize?: number;
  concurrency?: number;
  startOffset?: number;
  retry?: RetryDownloadChunkOptions;
}

export declare class IResourceLoader {
  static type: ResourceType;
  constructor(config: ResourceLoaderConfig);

  /**
   * Download resource to the memory
   *
   * @param resource - Resource object
   * @returns resource data
   */
  download(resource: Resource): Promise<Buffer>;

  /**
   * Download resource to the file with provided downloadPath
   *
   * @param resource - Resource object
   * @param downloadPath - Path to download file to
   */
  downloadToFile(resource: Resource, downloadPath: string): Promise<void>;
}
