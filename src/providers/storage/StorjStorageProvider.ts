import { promises as fs } from "fs";
import { AccessResultStruct as Access } from "uplink-nodejs/access";
import { ProjectResultStruct as Project } from "uplink-nodejs/project";
import { Buffer } from "buffer";
import IStorageProvider from "./IStorageProvider";
import Offer from "../../models/Offer";
import { isNodeJS } from "../../utils";
import StorageObject from "../../types/storage/StorageObject";

export default class StorJStorageProvider implements IStorageProvider {
    static UPLOAD_BUFFER_SIZE = 4194304; // 4 mb
    static DOWNLOAD_BUFFER_SIZE = 4194304; // 4mb

    private storageName: string;
    private accessToken: string;
    private _access?: Access;
    private _project?: Project;
    private _storj?: any;

    constructor(credentials: any) {
        if (!isNodeJS()) {
            throw Error("StorageProvider: StorJ is supported only in the node.js execution environment");
        }

        this.storageName = credentials.storageId;
        this.accessToken = credentials.token;
    }

    async calculateStorageDepostit(offer: Offer, sizeMb: number, hours: number): Promise<number> {
        const offerInfo = await offer.getInfo();
        const properties = JSON.parse(offerInfo.properties);

        return properties.priceMbPerHour * sizeMb * hours;
    }

    async uploadFile(
        localPath: string,
        remotePath: string,
        progressListener?: (total: number, current: number) => void,
    ): Promise<void> {
        const storj = await this.lazyStorj();

        const options = new storj.UploadOptions();
        const project = await this.lazyProject();
        const uploader = await project.uploadObject(this.storageName, remotePath, options);

        const file = await fs.open(localPath, "r");
        const contentLength = (await file.stat()).size;
        let totalWritten = 0;

        while (totalWritten < contentLength) {
            const remaining = contentLength - totalWritten;
            const buffer = Buffer.alloc(Math.min(remaining, StorJStorageProvider.UPLOAD_BUFFER_SIZE));
            const bytesRead = (await file.read(buffer, 0, buffer.length)).bytesRead;
            await uploader.write(buffer, bytesRead);
            totalWritten += bytesRead;
            if (!!progressListener) {
                progressListener(contentLength, totalWritten);
            }
        }

        await uploader.commit();
        await file.close();
    }

    async downloadFile(
        remotePath: string,
        localPath: string,
        progressListener?: (total: number, current: number) => void,
    ): Promise<void> {
        const storj = await this.lazyStorj();

        const contentLength = await this.getSize(remotePath);
        const project = await this.lazyProject();
        const options = new storj.DownloadOptions(0, contentLength);
        const downloader = await project.downloadObject(this.storageName, remotePath, options);

        const file = await fs.open(localPath, "w");
        let totalWritten = 0;

        while (totalWritten < contentLength) {
            const remaining = contentLength - totalWritten;
            const buffer = Buffer.alloc(Math.min(remaining, StorJStorageProvider.DOWNLOAD_BUFFER_SIZE));
            const bytesRead = ((await downloader.read(buffer, buffer.length)) as any).bytes_read;
            await file.write(buffer, 0, bytesRead);
            totalWritten += bytesRead;

            if (!!progressListener) {
                progressListener(contentLength, totalWritten);
            }
        }

        await downloader.close();
        await file.close();
    }

    async deleteFile(remotePath: string): Promise<void> {
        const project = await this.lazyProject();
        await project.deleteObject(this.storageName, remotePath);
    }

    async listObjects(storagePath: string): Promise<StorageObject[]> {
        const storj = await this.lazyStorj();
        const project = await this.lazyProject();
        const objects = await project.listObjects(this.storageName, {
            recursive: true,
            cursor: "",
            prefix: storagePath,
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

    async getSize(remotePath: string): Promise<number> {
        const project = await this.lazyProject();
        const objectInfo = await project.statObject(this.storageName, remotePath);

        return objectInfo.system.content_length;
    }
    private async lazyStorj(): Promise<any> {
        if (!this._storj) {
            this._storj = await require("uplink-nodejs");
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
