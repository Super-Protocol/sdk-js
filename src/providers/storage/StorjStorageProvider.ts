import { promises as fs } from "fs";
import { AccessResultStruct as Access } from "uplink-nodejs/access";
import { ProjectResultStruct as Project } from "uplink-nodejs/project";
import { Buffer } from "buffer";
import RemoteObject from "../../types/storage/RemoteObject";
import IStorageProvider from "./IStorageProvider";
import Offer from "../../models/Offer";
import { isNodeJS } from "../../utils";

export default class StorJStorageProvider implements IStorageProvider {
    static UPLOAD_BUFFER_SIZE: number = 4194304; // 4 mb
    static DOWNLOAD_BUFFER_SIZE: number = 4194304; // 4mb

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
        let offerInfo = await offer.getInfo();
        let properties = JSON.parse(offerInfo.properties);
        return properties.priceMbPerHour * sizeMb * hours;
    }

    async uploadFile(
        localPath: string,
        remotePath: string,
        progressListener?: (total: number, current: number) => void
    ): Promise<void> {
        const storj = await this.lazyStorj();

        let options = new storj.UploadOptions();
        let project = await this.lazyProject();
        let uploader = await project.uploadObject(this.storageName, remotePath, options);

        let file = await fs.open(localPath, "r");
        let contentLength = (await file.stat()).size;
        let totalWritten = 0;

        while (totalWritten < contentLength) {
            let remaining = contentLength - totalWritten;
            let buffer = Buffer.alloc(Math.min(remaining, StorJStorageProvider.UPLOAD_BUFFER_SIZE));
            let bytesRead = (await file.read(buffer, 0, buffer.length)).bytesRead;
            await uploader.write(buffer, bytesRead);
            totalWritten += bytesRead;
            if (typeof progressListener != "undefined") {
                progressListener(contentLength, totalWritten);
            }
        }

        await uploader.commit();
        await file.close();
    }

    async downloadFile(
        remotePath: string,
        localPath: string,
        progressListener?: (total: number, current: number) => void
    ): Promise<void> {
        const storj = await this.lazyStorj();

        let contentLength = await this.getSize(remotePath);
        let project = await this.lazyProject();
        let options = new storj.DownloadOptions(0, contentLength);
        let downloader = await project.downloadObject(this.storageName, remotePath, options);

        let file = await fs.open(localPath, "w");
        let totalWritten = 0;

        while (totalWritten < contentLength) {
            let remaining = contentLength - totalWritten;
            let buffer = Buffer.alloc(Math.min(remaining, StorJStorageProvider.DOWNLOAD_BUFFER_SIZE));
            let bytesRead = ((await downloader.read(buffer, buffer.length)) as any).bytes_read;
            await file.write(buffer, 0, bytesRead);
            totalWritten += bytesRead;

            if (typeof progressListener != "undefined") {
                progressListener(contentLength, totalWritten);
            }
        }

        await downloader.close();
        await file.close();
    }

    async deleteFile(remotePath: string): Promise<void> {
        let project = await this.lazyProject();
        await project.deleteObject(this.storageName, remotePath);
    }

    async listObjects(storagePath: string): Promise<RemoteObject[]> {
        const storj = await this.lazyStorj();

        let options = new storj.ListObjectsOptions(undefined, undefined, false, true, true);
        let project = await this.lazyProject();
        let objects = await project.listObjects(`${this.storageName}${storagePath}`, options);
        let result = [];
        for (let key in Object.keys(objects)) {
            let value = objects[key];
            result.push(this.toRemoteObjectInfo(value));
        }
        return result;
    }

    async getSize(remotePath: string): Promise<number> {
        let project = await this.lazyProject();
        let objectInfo = await project.statObject(this.storageName, remotePath);
        return objectInfo.system.content_length;
    }

    private toRemoteObjectInfo(obj: any): RemoteObject {
        let res = new RemoteObject(
            obj.key,
            obj.system.content_length,
            obj.is_prefix == 1,
            obj.custom.count,
            new Date(obj.system.created * 1000) // TODO: check timezone
        );

        return res;
    }

    private async lazyStorj(): Promise<any> {
        if (typeof this._storj == "undefined") {
            this._storj = await require("uplink-nodejs");
        }

        return this._storj;
    }

    private async lazyAccess(): Promise<Access> {
        if (typeof this._access == "undefined") {
            const storj = await this.lazyStorj();
            const uplink = new storj.Uplink();
            this._access = await uplink.parseAccess(this.accessToken);
        }

        return this._access!;
    }

    private async lazyProject(): Promise<Project> {
        if (typeof this._project == "undefined") {
            const access = await this.lazyAccess();
            this._project = await access.openProject();
        }

        return this._project;
    }
}
