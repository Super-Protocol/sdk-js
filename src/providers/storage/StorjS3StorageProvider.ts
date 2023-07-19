import { S3 } from "aws-sdk";

export interface ObjectMetadata {
    name: string;
    size: number;
    createdAt: Date;
}

export type S3ClientConfig = {
    accessKeyId: string;
    secretAccessKey: string;
    endpoint: string;
    bucket: string;
};

// TODO add streams support https://superprotocol.atlassian.net/browse/SP-3203
export class StorjS3StorageProvider {
    private readonly s3Client: S3;
    private readonly bucket: string;

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

    private async storageUpload(remotePath: string, value: Buffer): Promise<void> {
        const result = await this.s3Client
            .putObject({
                ACL: "public-read",
                Body: value,
                Bucket: this.bucket,
                Key: remotePath,
            })
            .promise();
        if (result.$response.error) {
            throw result.$response.error;
        }
    }

    private async storageDelete(key: string) {
        const deleteResult = await this.s3Client
            .deleteObject({
                Bucket: this.bucket,
                Key: key,
            })
            .promise();
        if (deleteResult.$response.error) {
            throw deleteResult.$response.error;
        }
    }

    private async storageDownload(filepath: string): Promise<S3.Body> {
        const downloadStream = await this.s3Client
            .getObject({
                Bucket: this.bucket,
                Key: filepath,
            })
            .promise();
        if (downloadStream.$response.error) {
            throw downloadStream.$response.error;
        }

        return downloadStream.Body || Buffer.from([]);
    }

    private async storageListFiles(key: string): Promise<ObjectMetadata[]> {
        const prefix = key.endsWith("/") ? key : `${key}/`;

        const listObjects = await this.s3Client
            .listObjectsV2({
                Bucket: this.bucket,
                Prefix: prefix,
            })
            .promise();
        let result: ObjectMetadata[] = [];
        if (listObjects.Contents) {
            result = listObjects.Contents.map((object) => ({
                name: object.Key || "",
                createdAt: object.LastModified || new Date(),
                size: object.Size || 0,
            }));
        }

        return result;
    }

    async uploadFile(key: string, value: Buffer): Promise<void> {
        return this.storageUpload(key, value);
    }

    async deleteFile(key: string) {
        return this.storageDelete(key);
    }

    async downloadFile(key: string): Promise<S3.Body> {
        return this.storageDownload(key);
    }

    async listObjects(key: string): Promise<ObjectMetadata[]> {
        return this.storageListFiles(key);
    }
}
