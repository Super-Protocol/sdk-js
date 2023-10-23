import { Readable, Transform, TransformCallback } from 'stream';
import StorageObject from '../../types/storage/StorageObject';
import IStorageProvider, { DownloadConfig } from './IStorageProvider';

export type DownloadChunkMethodType = (
  provider: IStorageProvider,
  objectPath: string,
  chunk: ChunkType,
) => Promise<Buffer>;

export type RetryDownloadChunkOptions = {
  retryMaxCount?: number;
  onRetry?: (error: unknown, chunk: ChunkType, attemptLeft: number) => void;
  retryWaitTimeFactory?: () => () => number;
};

export type ChunkType = {
  offset: bigint;
  length: number;
  dataSize: bigint;
  chunk: number;
  chunkCount: number;
};

function* generateChunks(dataSize: bigint, chunkSize: number, startOffset = BigInt(0)) {
  let chunk = 0;
  let offset = startOffset;

  while (dataSize > offset) {
    yield {
      offset,
      length: chunkSize > dataSize - offset ? Number(dataSize - offset) : chunkSize,
      dataSize,
      chunk: chunk++,
      chunksCount: Math.ceil(Number(dataSize / BigInt(chunkSize))),
    };

    offset += BigInt(chunkSize);
  }
}

class ChunkedReadableTransform extends Transform {
  constructor(
    private downloadChunk: (chunk: ChunkType) => Promise<Buffer>,
    params: { concurrency: number },
  ) {
    super({
      objectMode: true,
      highWaterMark: params.concurrency,
    });
  }

  _transform(chunk: ChunkType, encoding: BufferEncoding, callback: TransformCallback) {
    const resultPromise = this.downloadChunk(chunk);

    callback(null, {
      resultPromise,
      chunk,
    });
  }
}

class ChainedChunksReadableTransform extends Transform {
  constructor(private progressListener?: (total: number, current: number) => void) {
    super({
      objectMode: true,
      highWaterMark: 1,
    });
  }

  _transform(
    obj: { resultPromise: Promise<Buffer>; chunk: ChunkType },
    encoding: BufferEncoding,
    callback: TransformCallback,
  ) {
    obj.resultPromise.then(
      (data) => {
        callback(null, data);

        if (this.progressListener) {
          this.progressListener(
            Number(obj.chunk.dataSize),
            Number(obj.chunk.offset) + obj.chunk.length,
          );
        }
      },
      (err) => {
        callback(err);
      },
    );
  }
}

export const downloadChunkMethod = async (
  provider: IStorageProvider,
  objectPath: string,
  chunk: ChunkType,
): Promise<Buffer> => {
  let position = 0;
  const buffer = Buffer.alloc(chunk.length);

  const dataStream = await provider.downloadFile(objectPath, {
    offset: Number(chunk.offset),
    length: chunk.length,
  });

  for await (const data of dataStream) {
    data.copy(buffer, position);
    position += data.length;

    if (position > chunk.length) {
      throw new Error('Chunk buffer is overflow, read data is more than requested for chunk');
    }
  }

  return buffer;
};

export const createDownloadChunkMethodWithRetry = (
  downloadChunkMethod: DownloadChunkMethodType,
  {
    retryMaxCount = 3,
    retryWaitTimeFactory = () => () => 1000,
    onRetry,
  }: RetryDownloadChunkOptions = {},
): DownloadChunkMethodType => {
  return async (
    provider: IStorageProvider,
    objectPath: string,
    chunk: ChunkType,
  ): Promise<Buffer> => {
    const retryWaitTime = retryWaitTimeFactory();
    //let lastError: unknown = null;
    let retryCount = retryMaxCount;

    while (retryCount > 0) {
      try {
        return await downloadChunkMethod(provider, objectPath, chunk);
      } catch (error) {
        //lastError = error;
      }

      retryCount--;

      if (onRetry) {
        onRetry(null, chunk, retryCount);
      }

      if (retryCount !== 0) {
        await new Promise<void>((resolve, reject) => setTimeout(resolve, retryWaitTime()));
      }
    }

    throw new Error(
      `Max retry attempts was reached for object path ${objectPath}, offset ${
        chunk.offset
      }, length ${
        chunk.length
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }`,
    );
  };
};

export class DownloadDecorator implements IStorageProvider {
  constructor(
    private provider: IStorageProvider,
    private chunkDownloaderMethod: DownloadChunkMethodType,
    private options: { chunkSize: number; concurrency: number; offset?: number },
  ) {}

  uploadFile(
    inputStream: Readable,
    remotePath: string,
    contentLength: number,
    progressListener?: (total: number, current: number) => void,
  ): Promise<void> {
    return this.provider.uploadFile(inputStream, remotePath, contentLength, progressListener);
  }

  async downloadFile(
    remotePath: string,
    config?: DownloadConfig,
    progressListener?: (total: number, current: number) => void,
  ): Promise<Readable> {
    if (config?.length) {
      return this.provider.downloadFile(remotePath, config, progressListener);
    }

    const offset = BigInt(this.options.offset ?? 0);
    const objectSize = await this.provider.getObjectSize(remotePath);
    const chunksStream = Readable.from(
      generateChunks(BigInt(objectSize), this.options.chunkSize, offset),
    );

    const downloadStream = new ChunkedReadableTransform(
      async (chunk: ChunkType): Promise<Buffer> => {
        return this.chunkDownloaderMethod(this.provider, remotePath, chunk);
      },
      {
        concurrency: this.options.concurrency,
      },
    );

    const chainedStream = new ChainedChunksReadableTransform(progressListener);

    return chunksStream
      .pipe(downloadStream)
      .on('error', (error) => {
        chainedStream.emit('error', error);
      })
      .pipe(chainedStream);
  }

  deleteObject(remotePath: string): Promise<void> {
    return this.provider.deleteObject(remotePath);
  }

  listObjects(remotePath: string): Promise<StorageObject[]> {
    return this.provider.listObjects(remotePath);
  }

  getObjectSize(remotePath: string): Promise<number> {
    return this.provider.getObjectSize(remotePath);
  }

  getLastModified(remotePath: string): Promise<Date | null> {
    return this.provider.getLastModified(remotePath);
  }
}
