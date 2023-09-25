import { StorageType } from '@super-protocol/dto-js';
import StorageAccess from '../../types/storage/StorageAccess';
import IStorageProvider from './IStorageProvider';
import StorjStorageProvider from './StorjStorageProvider';
import { S3StorageProvider } from './S3StorageProvider';

export default (storageAccess: StorageAccess): IStorageProvider => {
    const key = storageAccess.storageType as StorageType;
    switch (key) {
        case StorageType.StorJ:
            return new StorjStorageProvider(
                storageAccess.credentials,
                storageAccess.maximumConcurrent,
            );
        case StorageType.S3:
            return new S3StorageProvider(storageAccess.credentials);
        default:
            throw Error(`Unsupported storageType ${key}`);
    }
};
