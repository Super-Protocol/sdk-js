import { StorageType } from "@super-protocol/sp-dto-js";
import StorageAccess from "../../types/storage/StorageAccess";
import IStorageProvider from "./IStorageProvider";
import StorjStorageProvider from "./StorjStorageProvider";

export default (storageAccess: StorageAccess): IStorageProvider => {
    let key = storageAccess.storageType as StorageType;
    switch (key) {
        case StorageType.StorJ:
            return new StorjStorageProvider(storageAccess.credentials);
    }
};
