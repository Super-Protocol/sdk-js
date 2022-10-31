import { ResourceType, StorageProviderResource, StorageType, UrlResource } from "@super-protocol/dto-js";

const mockHttp = {
    get: jest.fn(),
    on: jest.fn(),
    createServer: jest.fn(),
};
jest.mock("http", () => mockHttp);
jest.mock("https", () => mockHttp);

const mockFs = {
    promises: jest.fn().mockReturnThis(),
    createReadStream: jest.fn(),
    createWriteStream: jest.fn(),
};
jest.mock("fs", () => mockFs);

const streamMock = {
    get promises() {
        return this;
    },
    pipeline: jest.fn(),
    Readable: jest.requireActual("stream").Readable,
    Writable: jest.requireActual("stream").Writable,
    Transform: jest.requireActual("stream").Transform,
};
jest.mock("stream", () => streamMock);

const mockStorJStorageProvider = {
    downloadFile: jest.fn(),
    getObjectSize: jest.fn(),
};
jest.mock("../src/providers/storage/StorjStorageProvider", () =>
    jest.fn().mockImplementation(() => mockStorJStorageProvider),
);

import { getResourceLoader } from "../src/utils/resourceLoaders";
import { mockReadStream } from "./mocks/ReadStream.mock";

describe("ResourceLoader", () => {
    const testStreamData = "testStreamData";

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getResourceLoader", () => {
        describe("downloadFile", () => {
            const httpProtocols = ["http", "https"];

            test.each(httpProtocols)("download from internet to buffer", async (protocol) => {
                const urlResource: UrlResource = {
                    type: ResourceType.Url,
                    url: `${protocol}://file.url`,
                };
                const ResourceLoader = getResourceLoader(urlResource.type);

                mockHttp.get.mockImplementationOnce((_url, cb) => {
                    cb(mockReadStream(testStreamData));
                });

                const data = await new ResourceLoader().download(urlResource);

                expect(mockHttp.get.mock.calls[0][0]).toEqual(urlResource.url);
                expect(data.toString()).toEqual(testStreamData);
            });

            test("download from filesystem to buffer", async () => {
                mockFs.createReadStream.mockReturnValueOnce(mockReadStream(testStreamData));
                const filePath = "file.path";
                const urlResource: UrlResource = {
                    type: ResourceType.Url,
                    url: `file://${filePath}`,
                };
                const ResourceLoader = getResourceLoader(urlResource.type);

                const data = await new ResourceLoader().download(urlResource);

                expect(mockFs.createReadStream).toHaveBeenCalledWith(filePath);
                expect(data.toString()).toEqual(testStreamData);
            });

            test("download from internet to file", async () => {
                const readStream = mockReadStream(testStreamData);
                const writeStream = "writeStream";

                mockFs.createWriteStream.mockReturnValueOnce(writeStream);
                mockHttp.get.mockImplementation((_url, cb) => {
                    cb(readStream);
                });

                const filePathToStore = "file/path/to/store";
                const urlResource: UrlResource = {
                    type: ResourceType.Url,
                    url: `https://file.url`,
                };
                const ResourceLoader = getResourceLoader(urlResource.type);

                const data = await new ResourceLoader().downloadToFile(urlResource, filePathToStore);

                expect(data).toBeUndefined();
                expect(streamMock.pipeline).toHaveBeenCalledWith(readStream, writeStream);
                expect(mockFs.createWriteStream).toHaveBeenCalledWith(filePathToStore);
            });
        });
    });

    describe("StorageProviderResource", () => {
        describe("StorJ", () => {
            describe("downloadFile", () => {
                const storJResource: StorageProviderResource = {
                    type: ResourceType.StorageProvider,
                    storageType: StorageType.StorJ,
                    filepath: "file.path",
                    credentials: {
                        token: `token`,
                        storageId: "demo-bucket",
                    },
                };
                const ResourceLoader = getResourceLoader(storJResource.type);

                test("download to buffer", async () => {
                    const readStream = mockReadStream(testStreamData);
                    mockStorJStorageProvider.downloadFile.mockReturnValueOnce(readStream);

                    const data = await new ResourceLoader().download(storJResource);

                    expect(data.toString()).toEqual(testStreamData);
                    expect(mockStorJStorageProvider.downloadFile).toHaveBeenCalledWith(
                        storJResource.filepath,
                        {},
                        undefined,
                    );
                });

                test("download to file", async () => {
                    const readStream = mockReadStream(testStreamData);
                    const writeStream = "writeStream";
                    const filePathToStore = "file/path/to/store";

                    mockFs.createWriteStream.mockReturnValueOnce(writeStream);
                    mockStorJStorageProvider.downloadFile.mockReturnValueOnce(readStream);

                    const data = await new ResourceLoader().downloadToFile(storJResource, filePathToStore);

                    expect(data).toBeUndefined();
                    expect(mockStorJStorageProvider.downloadFile).toHaveBeenCalledWith(
                        storJResource.filepath,
                        {},
                        undefined,
                    );
                    expect(streamMock.pipeline).toHaveBeenCalledWith(readStream, writeStream);
                    expect(mockFs.createWriteStream).toHaveBeenCalledWith(filePathToStore);
                });
            });
        });
    });
});
