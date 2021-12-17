import Offer from "../../models/Offer";
import RemoteObject from "../../types/storage/RemoteObject";

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
    listObjects(storagePath: string): Promise<RemoteObject[]>;
    getSize(remotePath: string): Promise<number>;
    calculateStorageDepostit(
        offer: Offer,
        sizeMb: number,
        hours: number
    ): Promise<number>;
}
