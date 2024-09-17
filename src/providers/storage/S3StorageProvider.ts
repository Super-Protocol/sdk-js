import {
  AbortMultipartUploadCommand,
  CompletedPart,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandInput,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  ListObjectsV2Command,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import IStorageProvider, { DownloadConfig } from './IStorageProvider.js';
import { Readable } from 'stream';
import StorageObject from '../../types/storage/StorageObject.js';
import { getStreamChunks } from '../../utils/helpers/getStreamChunks.js';
import { S3Credentials } from '@super-protocol/dto-js';
import path from 'path';

export type S3ClientConfig = Omit<S3Credentials, 'prefix'> & {
  region?: string;
  prefix?: string;
};

export class S3StorageProvider implements IStorageProvider {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly prefix: string;
  private readonly multipartChunkSizeInBytes = 64 * 1024 * 1024; // 64MB
  private readonly defaultRegion = 'us-east-1';

  constructor(storageAccess: S3ClientConfig) {
    const { accessKeyId, secretKey, endpoint, bucket, region, prefix } = storageAccess;
    if (!accessKeyId) throw new Error('Access key id is undefined');
    if (!secretKey) throw new Error('Secret access is undefined');
    if (!endpoint) throw new Error('Endpoint is undefined');
    if (!bucket) throw new Error('Bucket is undefined');
    if (prefix && (prefix.startsWith('/') || !prefix.endsWith('/'))) {
      throw new Error(
        `Prefix is invalid: it must not start with "/" and must end with "/" (prefix=${prefix})`,
      );
    }

    this.bucket = bucket;
    this.prefix = prefix || '';

    this.s3Client = new S3Client({
      credentials: {
        accessKeyId,
        secretAccessKey: secretKey,
      },
      region: region || this.defaultRegion,
      endpoint,
      forcePathStyle: true,
    });
  }

  private applyPrefix(key: string): string {
    return path.join(this.prefix, '/', key);
  }

  async uploadFile(
    inputStream: Readable | Blob,
    remotePath: string,
    contentLength: number,
    progressListener?: ((total: number, current: number) => void) | undefined,
  ): Promise<void> {
    // For performance & cost optimization
    // https://docs.storj.io/dcs/api-reference/s3-compatible-gateway/multipart-upload/multipart-part-size
    const key = this.applyPrefix(remotePath);
    let body: Uint8Array | Readable;

    if (inputStream instanceof Blob) {
      body = new Uint8Array(await inputStream.arrayBuffer());
    } else {
      body = inputStream;
    }

    if (contentLength >= this.multipartChunkSizeInBytes) {
      return this.multipartUpload(inputStream, key, contentLength, progressListener);
    }

    const putObjectCommand = new PutObjectCommand({
      Body: body,
      Bucket: this.bucket,
      Key: key,
      ContentLength: contentLength,
    });

    progressListener?.(contentLength, 0);

    await this.s3Client.send(putObjectCommand);

    progressListener?.(contentLength, contentLength);
  }

  private async multipartUpload(
    inputStream: Readable | Blob,
    remotePath: string,
    contentLength: number,
    progressListener?: ((total: number, current: number) => void) | undefined,
  ): Promise<void> {
    const key = this.applyPrefix(remotePath);
    let transformedStream: Readable | Uint8Array;

    if (inputStream instanceof Blob) {
      transformedStream = new Uint8Array(await inputStream.arrayBuffer());
    } else {
      transformedStream = inputStream;
    }

    const createMultipartUploadCommand = new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const multipart = await this.s3Client.send(createMultipartUploadCommand);

    if (!multipart.UploadId) {
      throw new Error('UploadId property is empty');
    }

    let totalWritten = 0;
    const uploadId = multipart.UploadId;
    const parts: Array<CompletedPart> = [];
    const uploadPart = async (chunk: Uint8Array, partNumber: number): Promise<void> => {
      const uploadPartCommand = new UploadPartCommand({
        Body: chunk,
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      });

      const response = await this.s3Client.send(uploadPartCommand);

      parts.push({
        ETag: response.ETag,
        PartNumber: partNumber,
      });

      totalWritten += chunk.length;
      progressListener?.(contentLength, totalWritten);
    };
    try {
      if (transformedStream instanceof Readable) {
        for await (const streamChunk of getStreamChunks(
          transformedStream,
          this.multipartChunkSizeInBytes,
        )) {
          await uploadPart(streamChunk.data, streamChunk.partNumber);
        }
      } else {
        const chunkSize = this.multipartChunkSizeInBytes;
        let partNumber = 1;

        for (let offset = 0; offset < transformedStream.length; offset += chunkSize) {
          const chunk = transformedStream.slice(offset, offset + chunkSize);
          await uploadPart(chunk, partNumber);
          partNumber++;
        }
      }

      const completeMultipartUploadCommand = new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: multipart.UploadId,
        MultipartUpload: { Parts: parts },
      });

      await this.s3Client.send(completeMultipartUploadCommand);
    } catch (uploadingError) {
      const abortMultipartUploadCommand = new AbortMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: multipart.UploadId,
      });

      await this.s3Client.send(abortMultipartUploadCommand);

      throw uploadingError;
    }
  }

  async deleteObject(remotePath: string): Promise<void> {
    const key = this.applyPrefix(remotePath);

    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.s3Client.send(deleteObjectCommand);
  }

  async downloadFile(
    remotePath: string,
    config: DownloadConfig,
    progressListener?: ((total: number, current: number) => void) | undefined,
  ): Promise<Readable> {
    const key = this.applyPrefix(remotePath);

    const getObjectParams: GetObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };

    if (config) {
      const start = config.offset || 0;
      const end = start + (config.length || 0);
      getObjectParams.Range = `bytes=${start}-${end || ''}`;
    }

    const getObjectCommand = new GetObjectCommand(getObjectParams);
    const getObjectResult = await this.s3Client.send(getObjectCommand);

    if (!getObjectResult.Body || !(getObjectResult.Body instanceof Readable)) {
      throw new Error('download Body is undefined');
    }

    let current = 0;
    if (progressListener && getObjectResult.Body) {
      const fileBytesSize =
        getObjectResult.ContentLength || config.length || (await this.getObjectSize(remotePath));

      getObjectResult.Body.on('data', (chunk: Buffer | string) => {
        current += chunk.length;
        progressListener(fileBytesSize, current);
      });
    }

    return getObjectResult.Body;
  }

  async listObjects(remotePath: string): Promise<StorageObject[]> {
    const key = this.applyPrefix(
      remotePath.endsWith('/') || remotePath === '' ? remotePath : `${remotePath}/`,
    );

    const listObjectsCommand = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: key,
    });
    const listObjects = await this.s3Client.send(listObjectsCommand);

    let result: StorageObject[] = [];
    if (listObjects.Contents) {
      result = listObjects.Contents.map((object) => ({
        name: object.Key?.substring(this.prefix.length) || '',
        createdAt: object.LastModified || new Date(),
        size: object.Size || 0,
      }));
    }

    return result;
  }

  private async getMetadata(remotePath: string): Promise<HeadObjectCommandOutput> {
    const key = this.applyPrefix(remotePath);

    const headObjectCommand = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await this.s3Client.send(headObjectCommand);
  }

  async getObjectSize(remotePath: string): Promise<number> {
    const metadata = await this.getMetadata(remotePath);
    if (metadata.ContentLength === undefined) {
      throw new Error('ContentLength property is empty');
    }

    return metadata.ContentLength || 0;
  }

  async getLastModified(remotePath: string): Promise<Date> {
    const metadata = await this.getMetadata(remotePath);
    if (!metadata.LastModified) {
      throw new Error('LastModified property is empty');
    }

    return metadata.LastModified;
  }
}
