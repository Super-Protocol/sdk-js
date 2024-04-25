import StorageAccess from './StorageAccess.js';

type StorageFileAccess = StorageAccess & {
  filepath: string;
};

export default StorageFileAccess;
