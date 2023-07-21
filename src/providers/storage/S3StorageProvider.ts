import { S3 } from "aws-sdk";
import IStorageProvider, { DownloadConfig } from "./IStorageProvider";
import { Readable } from "stream";
import StorageObject from "../../types/storage/StorageObject";

export type S3ClientConfig = {
    accessKeyId: string;
    secretAccessKey: string;
    endpoint: string;
    bucket: string;
};

export class S3StorageProvider implements IStorageProvider {
    private readonly s3Client: S3;
    private readonly bucket: string;
    private readonly multipartChunkSizeInBytes = 64 * 1024 * 1024; // 64MB

    constructor(storageAccess: S3ClientConfig) {
        const { accessKeyId, secretAccessKey, endpoint, bucket } = storageAccess;
        if (!accessKeyId) throw new Error("Access key id is undefined");
        if (!secretAccessKey) throw new Error("Secret access is undefined");
        if (!endpoint) throw new Error("Endpoint is undefined");
        if (!bucket) throw new Error("Bucket is undefined");

        this.bucket = bucket;

        this.s3Client = new S3({
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            endpoint,
            s3ForcePathStyle: true,
            signatureVersion: "v4",
            httpOptions: { timeout: 0 },
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
        if (inputStream.readableHighWaterMark >= this.multipartChunkSizeInBytes) {
            return this.multipartUpload(inputStream, remotePath, contentLength, progressListener);
        }

        const result = await this.s3Client
            .putObject({
                Body: inputStream,
                Bucket: this.bucket,
                Key: remotePath,
            })
            .on("httpUploadProgress", ({ total, loaded }) => progressListener?.(total, loaded))
            .promise();
        if (result.$response.error) {
            throw result.$response.error;
        }
    }

    private async multipartUpload(
        inputStream: Readable,
        remotePath: string,
        contentLength: number,
        progressListener?: ((total: number, current: number) => void) | undefined,
    ) {
        const multipart = await this.s3Client
            .createMultipartUpload({
                Bucket: this.bucket,
                Key: remotePath,
            })
            .promise();

        if (!multipart.UploadId) {
            throw new Error("UploadId property is empty");
        }
        try {
            let totalWritten = 0;
            let partNumber = 0;
            const uploadId = multipart.UploadId;
            const parts: S3.CompletedPartList = [];

            for await (const buffer of inputStream) {
                partNumber++;
                const response = await this.s3Client
                    .uploadPart({
                        Body: buffer,
                        Bucket: this.bucket,
                        Key: remotePath,
                        UploadId: uploadId,
                        PartNumber: partNumber,
                    })
                    .promise();

                parts.push({
                    ETag: response.ETag,
                    PartNumber: partNumber,
                });

                totalWritten += buffer.length;
                if (!!progressListener) {
                    progressListener(contentLength, totalWritten);
                }
            }
            const doneParams: S3.CompleteMultipartUploadRequest = {
                Bucket: this.bucket,
                Key: remotePath,
                UploadId: multipart.UploadId,
                MultipartUpload: { Parts: parts },
            };

            await this.s3Client.completeMultipartUpload(doneParams).promise();
        } catch (uploadingError) {
            await this.s3Client
                .abortMultipartUpload({
                    Bucket: this.bucket,
                    Key: remotePath,
                    UploadId: multipart.UploadId,
                })
                .promise();

            throw uploadingError;
        }
    }

    async deleteObject(remotePath: string): Promise<void> {
        const deleteResult = await this.s3Client
            .deleteObject({
                Bucket: this.bucket,
                Key: remotePath,
            })
            .promise();
        if (deleteResult.$response.error) {
            throw deleteResult.$response.error;
        }
    }

    async downloadFile(
        remotePath: string,
        config: DownloadConfig,
        progressListener?: ((total: number, current: number) => void) | undefined,
    ): Promise<Readable> {
        const getObjectParams: S3.GetObjectRequest = {
            Bucket: this.bucket,
            Key: remotePath,
        };

        if (config) {
            const start = config.offset || 0;
            const end = start + (config.length || 0);
            getObjectParams.Range = `bytes=${start}-${end || ""}`;
        }

        const downloadStream = this.s3Client.getObject(getObjectParams).createReadStream();

        let current = 0;
        if (progressListener) {
            const fileBytesSize = config.length || (await this.getObjectSize(remotePath));

            downloadStream.on("data", (chunk) => {
                current += chunk.length;
                progressListener(fileBytesSize, current);
            });
        }

        return downloadStream;
    }

    async listObjects(remotePath: string): Promise<StorageObject[]> {
        const prefix = remotePath.endsWith("/") ? remotePath : `${remotePath}/`;

        const listObjects = await this.s3Client
            .listObjectsV2({
                Bucket: this.bucket,
                Prefix: prefix,
            })
            .promise();

        if (listObjects.$response.error) {
            throw listObjects.$response.error;
        }

        let result: StorageObject[] = [];
        if (listObjects.Contents) {
            result = listObjects.Contents.map((object) => ({
                name: object.Key || "",
                createdAt: object.LastModified || new Date(),
                size: object.Size || 0,
            }));
        }

        return result;
    }

    private async getMetadata(remotePath: string) {
        const getObjectParams: S3.HeadObjectRequest = {
            Bucket: this.bucket,
            Key: remotePath,
        };
        const metadata = await this.s3Client.headObject(getObjectParams).promise();
        if (metadata.$response.error) {
            throw metadata.$response.error;
        }

        return metadata;
    }

    async getObjectSize(remotePath: string): Promise<number> {
        const metadata = await this.getMetadata(remotePath);
        if (metadata.ContentLength === undefined) {
            throw new Error("ContentLength property is empty");
        }

        return metadata.ContentLength || 0;
    }

    async getLastModified(remotePath: string): Promise<Date> {
        const metadata = await this.getMetadata(remotePath);
        if (!metadata.LastModified) {
            throw new Error("LastModified property is empty");
        }

        return metadata.LastModified;
    }
}
