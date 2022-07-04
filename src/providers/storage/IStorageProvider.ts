import Offer from "../../models/Offer";
import StorageObject from "../../types/storage/StorageObject";
import stream from "stream";

export type DownloadConfig = {
    offset?: number;
    length?: number;
};
export default interface IStorageProvider {
    uploadFile(
        inputStream: stream.Readable,
        remotePath: string,
        contentLength: number,
        progressListener?: (total: number, current: number) => void,
    ): Promise<void>;
    downloadFile(
        remotePath: string,
        config: DownloadConfig,
        progressListener?: (total: number, current: number) => void,
    ): Promise<stream.Readable>;
    deleteFile(remotePath: string): Promise<void>;
    listObjects(remotePath: string): Promise<StorageObject[]>;
    getSize(remotePath: string): Promise<number>;
    calculateStorageDepostit(offer: Offer, sizeMb: number, hours: number): Promise<number>;
}
