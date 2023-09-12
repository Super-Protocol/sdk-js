import StorageAccess from './StorageAccess';

type StorageFileAccess = StorageAccess & {
    filepath: string;
};

export default StorageFileAccess;
