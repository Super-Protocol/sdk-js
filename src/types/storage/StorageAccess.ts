import { StorageType } from "@super-protocol/dto-js";

type StorageAccess = {
    storageType: StorageType;
    credentials: any;
    maximumConcurrent?: number
};

export default StorageAccess;
