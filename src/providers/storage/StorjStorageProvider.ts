import { AccessResultStruct as Access } from "@super-protocol/uplink-nodejs/access";
import { ProjectResultStruct as Project } from "@super-protocol/uplink-nodejs/project";
import { Buffer } from "buffer";
import IStorageProvider, { DownloadConfig } from "./IStorageProvider";
import Offer from "../../models/Offer";
import { isNodeJS } from "../../utils";
import StorageObject from "../../types/storage/StorageObject";
import stream from "stream";
import logger from "../../logger";
import { BigNumber } from "ethers";

export default class StorJStorageProvider implements IStorageProvider {
    static DOWNLOAD_BUFFER_SIZE = 4194304; // 4mb

    private logger = logger.child({ className: "StorJStorageProvider" });
    private bucket: string;
    private prefix: string;
    private accessToken: string;
    private _access?: Access;
    private _project?: Project;
    private _storj?: any;

    constructor(credentials: any) {
        if (!isNodeJS()) {
            throw Error("StorageProvider: StorJ is supported only in the node.js execution environment");
        }

        if (credentials.bucket) {
            this.bucket = credentials.bucket;
            this.prefix = credentials.prefix;

        } else if (credentials.storageId) {
            // back compatibility
            this.bucket = credentials.storageId;
            this.prefix = "";

        } else {
            throw Error("StorageProvider: Invalid StorJ credetials");
        }

        this.accessToken = credentials.token;
    }

    async calculateStorageDeposit(offer: Offer, sizeMb: number, hours: number): Promise<string> {
        const offerInfo = await offer.getInfo();
        const properties = JSON.parse(offerInfo.properties);
        return BigNumber.from(properties.priceMbPerHour).mul(sizeMb).mul(hours).toString();
    }

    async uploadFile(
        inputStream: stream.Readable,
        remotePath: string,
        contentLength: number,
        progressListener?: (total: number, current: number) => void,
    ): Promise<void> {
        const storj = await this.lazyStorj();
        const options = new storj.UploadOptions();
        const project = await this.lazyProject();
        const uploader = await project.uploadObject(this.bucket, this.prefix + remotePath, options);

        let totalWritten = 0;

        try {
            for await (const buffer of inputStream) {
                await uploader.write(buffer, buffer.length);
                totalWritten += buffer.length;
                if (!!progressListener) {
                    progressListener(contentLength, totalWritten);
                }
            }

            await uploader.commit();
        } catch (uploadingError) {
            try {
                await uploader.abort();
            } catch (abortingError) {
                logger.error({ err: abortingError }, "Failed to abort file uploading");
            }

            throw uploadingError;
        }
    }

    async downloadFile(
        remotePath: string,
        config: DownloadConfig,
        progressListener?: (total: number, current: number) => void,
    ): Promise<stream.Readable> {
        const storj = await this.lazyStorj();
        const project = await this.lazyProject();
        const length = config.length || (await this.getObjectSize(remotePath));
        const options = new storj.DownloadOptions(config.offset || 0, length);

        const downloader = await project.downloadObject(this.bucket, this.prefix + remotePath, options);

        const loader = async function* () {
            const readBuffer = Buffer.alloc(StorJStorageProvider.DOWNLOAD_BUFFER_SIZE);
            let current = 0;
            while (current < length) {
                // We have to cast result to any, because of the wrong type declartion in uplink-nodejs.
                const downloadResult: any = await downloader.read(readBuffer, readBuffer.length);
                const bytesRead = downloadResult.bytes_read;
                current += bytesRead;

                yield Buffer.from(readBuffer.subarray(0, bytesRead));

                if (!!progressListener) {
                    progressListener(length, current);
                }
            }
        };

        return stream.Readable.from(loader()).on("close", async () => {
            await downloader.close();
        });
    }

    async deleteObject(remotePath: string): Promise<void> {
        const project = await this.lazyProject();
        await project.deleteObject(this.bucket, this.prefix + remotePath);
    }

    async listObjects(remotePath: string): Promise<StorageObject[]> {
        const storj = await this.lazyStorj();
        const project = await this.lazyProject();
        const objects = await project.listObjects(this.bucket, {
            recursive: true,
            cursor: "",
            prefix: this.prefix + remotePath,
            system: true,
            custom: true,
        });
        const result = [];
        for (const key in Object.keys(objects)) {
            const value = objects[key];
            result.push({
                name: value.key,
                size: value.system.content_length,
                isFolder: value.is_prefix == 1,
                childrenCount: value.custom.count,
                createdAt: new Date(value.system.created * 1000), // TODO: check timezone
            });
        }

        return result;
    }

    async getObjectSize(remotePath: string): Promise<number> {
        const project = await this.lazyProject();
        const objectInfo = await project.statObject(this.bucket, this.prefix + remotePath);

        return objectInfo.system.content_length;
    }

    async getLastModified (remotePath: string): Promise<Date> {
        const project = await this.lazyProject();
        const objectInfo = await project.statObject(this.bucket, this.prefix + remotePath);

        return new Date(objectInfo.system.created * 1000);
    }

    private async lazyStorj(): Promise<any> {
        if (!this._storj) {
            this._storj = await require("@super-protocol/uplink-nodejs");
        }

        return this._storj;
    }

    private async lazyAccess(): Promise<Access> {
        if (!this._access) {
            const storj = await this.lazyStorj();
            const uplink = new storj.Uplink();
            this._access = await uplink.parseAccess(this.accessToken);
        }

        return this._access!;
    }

    private async lazyProject(): Promise<Project> {
        if (!this._project) {
            const access = await this.lazyAccess();
            this._project = await access.openProject();
        }

        return this._project;
    }
}
