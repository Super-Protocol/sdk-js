export default class RemoteObject {
    name: string;
    size: number;
    isFolder: boolean;
    childrenCount: number;
    createdAt: Date;

    constructor(name: string, size: number, isFolder: boolean, childrenCount: number, createdAt: Date) {
        this.name = name;
        this.size = size;
        this.isFolder = isFolder;
        this.childrenCount = childrenCount;
        this.createdAt = createdAt;
    }
}
