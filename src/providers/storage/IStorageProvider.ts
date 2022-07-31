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
    deleteObject(remotePath: string): Promise<void>;
    listObjects(remotePath: string): Promise<StorageObject[]>;
    getObjectSize(remotePath: string): Promise<number>;
    getLastModified(remotePath: string): Promise<Date>;
    calculateStorageDeposit(offer: Offer, sizeMb: number, hours: number): Promise<string>;
}
