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
import IStorageProvider, { DownloadConfig } from './IStorageProvider';
import { Readable } from 'stream';
import StorageObject from '../../types/storage/StorageObject';
import { getStreamChunks } from '../../utils/helpers/getStreamChunks';

export type S3ClientConfig = {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucket: string;
  region: string;
};

export class S3StorageProvider implements IStorageProvider {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly multipartChunkSizeInBytes = 64 * 1024 * 1024; // 64MB

  constructor(storageAccess: S3ClientConfig) {
    const { accessKeyId, secretAccessKey, endpoint, bucket, region } = storageAccess;
    if (!accessKeyId) throw new Error('Access key id is undefined');
    if (!secretAccessKey) throw new Error('Secret access is undefined');
    if (!endpoint) throw new Error('Endpoint is undefined');
    if (!bucket) throw new Error('Bucket is undefined');
    if (!region) throw new Error('Region is undefined');

    this.bucket = bucket;

    this.s3Client = new S3Client({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
      endpoint,
      forcePathStyle: true,
    });
  }

  async uploadFile(
    inputStream: Readable,
    remotePath: string,
    contentLength: number,
    progressListener?: ((total: number, current: number) => void) | undefined,
  ): Promise<void> {
    // For performance & cost optimization
    // https://docs.storj.io/dcs/api-reference/s3-compatible-gateway/multipart-upload/multipart-part-size
    if (contentLength >= this.multipartChunkSizeInBytes) {
      return this.multipartUpload(inputStream, remotePath, contentLength, progressListener);
    }

    const putObjectCommand = new PutObjectCommand({
      Body: inputStream,
      Bucket: this.bucket,
      Key: remotePath,
      ContentLength: contentLength,
    });

    progressListener?.(contentLength, 0);

    await this.s3Client.send(putObjectCommand);

    progressListener?.(contentLength, contentLength);
  }

  private async multipartUpload(
    inputStream: Readable,
    remotePath: string,
    contentLength: number,
    progressListener?: ((total: number, current: number) => void) | undefined,
  ): Promise<void> {
    const createMultipartUploadCommand = new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: remotePath,
    });

    const multipart = await this.s3Client.send(createMultipartUploadCommand);

    if (!multipart.UploadId) {
      throw new Error('UploadId property is empty');
    }
    try {
      let totalWritten = 0;
      const uploadId = multipart.UploadId;
      const parts: Array<CompletedPart> = [];

      for await (const streamChunk of getStreamChunks(inputStream, this.multipartChunkSizeInBytes)) {
        const uploadPartCommand = new UploadPartCommand({
          Body: streamChunk.data,
          Bucket: this.bucket,
          Key: remotePath,
          UploadId: uploadId,
          PartNumber: streamChunk.partNumber,
        });

        const response = await this.s3Client.send(uploadPartCommand);

        parts.push({
          ETag: response.ETag,
          PartNumber: streamChunk.partNumber,
        });

        totalWritten += streamChunk.data.length;
        if (!!progressListener) {
          progressListener(contentLength, totalWritten);
        }
      }

      const completeMultipartUploadCommand = new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: remotePath,
        UploadId: multipart.UploadId,
        MultipartUpload: { Parts: parts },
      });

      await this.s3Client.send(completeMultipartUploadCommand);
    } catch (uploadingError) {
      const abortMultipartUploadCommand = new AbortMultipartUploadCommand({
        Bucket: this.bucket,
        Key: remotePath,
        UploadId: multipart.UploadId,
      });

      await this.s3Client.send(abortMultipartUploadCommand);

      throw uploadingError;
    }
  }

  async deleteObject(remotePath: string): Promise<void> {
    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: remotePath,
    });
    await this.s3Client.send(deleteObjectCommand);
  }

  async downloadFile(
    remotePath: string,
    config: DownloadConfig,
    progressListener?: ((total: number, current: number) => void) | undefined,
  ): Promise<Readable> {
    const getObjectParams: GetObjectCommandInput = {
      Bucket: this.bucket,
      Key: remotePath,
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
    const prefix = remotePath.endsWith('/') ? remotePath : `${remotePath}/`;

    const listObjectsCommand = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });
    const listObjects = await this.s3Client.send(listObjectsCommand);

    let result: StorageObject[] = [];
    if (listObjects.Contents) {
      result = listObjects.Contents.map((object) => ({
        name: object.Key || '',
        createdAt: object.LastModified || new Date(),
        size: object.Size || 0,
      }));
    }

    return result;
  }

  private async getMetadata(remotePath: string): Promise<HeadObjectCommandOutput> {
    const headObjectCommand = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: remotePath,
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
