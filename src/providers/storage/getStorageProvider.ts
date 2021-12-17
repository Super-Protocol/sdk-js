import StorageType from "../../types/storage/StorageType";
import IStorageProvider from "./IStorageProvider";
import StorjStorageProvider from "./StorjStorageProvider";

export default (data: any): IStorageProvider => {
    let key = data.storageType as StorageType;
    switch (key) {
        case StorageType.StorJ:
            return new StorjStorageProvider(data);
    }
};
