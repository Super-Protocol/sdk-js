type StorageObject = {
    name: string;
    size: number;
    isFolder: boolean;
    childrenCount: number;
    createdAt: Date;
};

export default StorageObject;
