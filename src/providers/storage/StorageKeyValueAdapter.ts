import StorageAccess from "../../types/storage/StorageAccess";
import StorageObject from "../../types/storage/StorageObject";
import getStorageProvider from "./getStorageProvider";
import IStorageProvider from "./IStorageProvider";
import { Readable } from "stream";
import { Encryption } from "@super-protocol/dto-js";
import logger, { Logger } from "../../logger";

export interface ICipherService {
    setPrivateKey(privateKey: string, type?: "hex"): ICipherService;
    encrypt(content: string): Promise<Encryption>;
    decrypt(encryption: Encryption): Promise<string>;
}

export interface Config {
    retryPolicy: {
        maxCount: number;
        minDelay: number;
        maxDelay: number;
    };
    concurrency: number;
    chunkSize: number;
}

export default class StorageKeyValueAdapter<V extends object> {
    private readonly cipher: ICipherService;
    private readonly storageProvider: IStorageProvider;
    private readonly logger: Logger;

    constructor(storageAccess: StorageAccess, cipherService: ICipherService) {
        if (!storageAccess?.credentials) throw new Error("Credentials is empty");

        this.logger = logger.child({ class: StorageKeyValueAdapter.name });
        this.storageProvider = getStorageProvider(storageAccess);
        this.cipher = cipherService;
    }

    public async decrypt(encryption: Encryption, privateKey: string): Promise<V | null> {
        if (!encryption) return null;
        if (!privateKey) throw new Error("Private cannot be empty!");

        return JSON.parse(await this.cipher.setPrivateKey(privateKey).decrypt(encryption));
    }

    public async encrypt(data: V | null, privateKey: string): Promise<Encryption> {
        if (data === undefined) throw new Error("Data cannot be empty!");
        if (!privateKey) throw new Error("Private cannot be empty!");

        return this.cipher.setPrivateKey(privateKey).encrypt(JSON.stringify(data));
    }

    private async downloadFromStorage(filepath: string): Promise<string> {
        const downloadStream = await this.storageProvider.downloadFile(filepath, {});

        return this.streamToString(downloadStream);
    }

    private streamToString(stream: Readable): Promise<string> {
        const chunks: Buffer[] = [];

        return new Promise((resolve, reject) => {
            stream.on("data", (chunk) => {
                chunks.push(Buffer.from(chunk));
            });
            stream.on("error", (err) => reject(err));
            stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        });
    }

    private async storageUpload(key: string, value: V | null, privateKey: string) {
        try {
            const encryptedValue = await this.encrypt(value, privateKey);
            const buffer = Buffer.from(JSON.stringify(encryptedValue));
            await this.storageProvider.uploadFile(Readable.from(buffer), key, buffer.byteLength);
            this.logger.info({ data: key }, "Success uploading to storage");
        } catch (err) {
            this.logger.error({ err }, "Error uploading to storage");
            throw err;
        }
    }

    private async storageDelete(key: string) {
        try {
            await this.storageProvider.deleteObject(key);
            this.logger.info({ data: key }, "Success deleting from storage");
        } catch (err) {
            this.logger.info({ err }, "Error deleting from storage");
            throw err;
        }
    }

    private async storageDownload(key: string, privateKey: string): Promise<V | null> {
        try {
            const downloaded = await this.downloadFromStorage(key);
            this.logger.info({ key }, "Success download data from storage");

            if (!downloaded) return null;

            const decryptedValue = await this.decrypt(JSON.parse(downloaded), privateKey);

            return decryptedValue;
        } catch (err) {
            this.logger.info(
                {
                    err,
                    key,
                },
                "Error download data from storage",
            );
            throw err;
        }
    }

    private async storageListFiles(key: string): Promise<StorageObject[]> {
        try {
            const listObjects = await this.storageProvider.listObjects(key);
            this.logger.trace(
                {
                    data: listObjects,
                    key,
                },
                "Success list objects from storage",
            );

            return listObjects.filter((obj) => !obj.isFolder);
        } catch (err) {
            this.logger.info(
                {
                    err,
                    key,
                },
                "Error list objects from storage",
            );
            throw err;
        }
    }

    async set(key: string, value: V | null, privateKey: string) {
        return this.storageUpload(key, value, privateKey);
    }

    async delete(key: string) {
        return this.storageDelete(key);
    }

    async get(key: string, privateKey: string): Promise<V | null> {
        return this.storageDownload(key, privateKey);
    }

    async listFiles(key: string) {
        return this.storageListFiles(key);
    }
}
