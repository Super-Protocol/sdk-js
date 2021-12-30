import Offer from "../../models/Offer";
import StorageObject from "../../types/storage/StorageObject";

export default interface IStorageProvider {
    uploadFile(
        localPath: string,
        remotePath: string,
        progressListener?: (total: number, current: number) => void
    ): Promise<void>;
    downloadFile(
        remotePath: string,
        localPath: string,
        progressListener?: (total: number, current: number) => void
    ): Promise<void>;
    deleteFile(remotePath: string): Promise<void>;
    listObjects(remotePath: string): Promise<StorageObject[]>;
    getSize(remotePath: string): Promise<number>;
    calculateStorageDepostit(offer: Offer, sizeMb: number, hours: number): Promise<number>;
}
