import { Readable } from "stream";
import IStorageProvider, { DownloadConfig } from "../../src/providers/storage/IStorageProvider";
import StorageObject from "../../src/types/storage/StorageObject";
import { mockReadStream } from "./ReadStream.mock";

const DEFAULT_SIZE = 1;

export interface MockStorageProviderProps {
    storageObject: StorageObject;
}

export const getDefaultListObjectMock = (name: string) => ({
    name,
    size: DEFAULT_SIZE,
    createdAt: new Date(),
});

export default class MockStorageProvider implements IStorageProvider {
    private cache = new Map<string, string>();
    private async streamToString(stream: Readable): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let data = "";

            stream.on("data", (chunk) => {
                data += chunk;
            });

            stream.on("end", () => {
                resolve(data);
            });

            stream.on("error", (error) => {
                reject(error);
            });
        });
    }
    public async uploadFile(
        inputStream: Readable,
        remotePath: string,
        contentLength: number,
        progressListener?: (total: number, current: number) => void,
    ): Promise<void> {
        const value = await this.streamToString(inputStream);
        this.cache.set(remotePath, value);
    }
    public async downloadFile(
        remotePath: string,
        config: DownloadConfig,
        progressListener?: (total: number, current: number) => void,
    ): Promise<Readable> {
        return mockReadStream(this.cache.get(remotePath));
    }
    public async deleteObject(remotePath: string): Promise<void> {
        this.cache.delete(remotePath);
    }
    public async listObjects(remotePath: string): Promise<StorageObject[]> {
        return [...this.cache.keys()]
            .filter((key) => key.startsWith(remotePath))
            .map((key) => getDefaultListObjectMock(key));
    }
    public async getObjectSize(remotePath: string): Promise<number> {
        return DEFAULT_SIZE;
    }
    public async getLastModified(remotePath: string): Promise<Date> {
        return new Date();
    }
}
