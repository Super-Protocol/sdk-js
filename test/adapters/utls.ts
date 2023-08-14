import { StorageType } from "@super-protocol/dto-js";

export const keyValueStorageAdapterConfig = {
    storageType: StorageType.S3,
    credentials: {
        accessKeyId: "test-access-key-id",
        secretAccessKey: "test-secret-access-key",
        endpoint: "/",
        bucket: "test-bucket",
    },
    maximumConcurrent: 1,
};
