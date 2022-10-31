import { EtlModel as IEtlModel, Resource, ResourceType, StorageType } from "@super-protocol/dto-js";
import { EtlModelImageSubtype, EtlModelType } from "@super-protocol/dto-js/build/enum/EtlModel.enum";
import { ResourceContentType } from "@super-protocol/dto-js/build/enum/ResourceContentType.enum";

const mockLogger = {
    child: jest.fn().mockReturnThis(),
    error: jest.fn(),
};
jest.mock("../src/logger", () => mockLogger);

const mockResourceLoader = {
    download: jest.fn(),
};
jest.mock("../src/utils/resourceLoaders", () => ({
    getResourceLoader: () => jest.fn().mockImplementation(() => mockResourceLoader),
}));

import { EtlModel } from "../src/models/EtlModel";

const etlModelObj: IEtlModel = {
    type: EtlModelType.Image,
    subtype: EtlModelImageSubtype.PNG,
    metadata: {
        resourceContentType: ResourceContentType.JSON,
        resource: {
            type: ResourceType.StorageProvider,
            storageType: StorageType.StorJ,
            filepath: "bucket/super-mega-file.tar.gz",
            credentials: {
                token: "1CpjMHoz2NChsrBg17tRAKvo6mYzerHPbXTxezYCp6YbdFmv4fRboLwH1sMHEGd3AJPhFMpagrdQN9M3x5r4NPRWJjVTKrFkHJ8XY8mce9ad24Mon1WQHEwEWzYTVb6Nxy4HJ8cBCS1cptymBip7dbTXbaRbYMpFF9fw7SvdB5qHogUfT6TmXU7jfLbdJHuEwvsa2XzqbtGzdahv19QcoWhqXmkduqGFgyv8rZnTzGUax8yeRANYga1pdMLree74ps7JfPkcMaCMoDWbEt",
            },
        } as Resource,
    },
};

describe("EtlModel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("pack and unpack", async () => {
        const etlModel = new EtlModel(etlModelObj);
        const packed = await etlModel.pack();

        expect(packed).toBeInstanceOf(Buffer);
        expect(packed.length).toBeGreaterThan(0);

        const unpacked = await EtlModel.unpack(packed);

        expect({
            type: unpacked.getType(),
            subtype: unpacked.getSubtype(),
            metadata: unpacked.getMetadata(),
        }).toEqual(etlModelObj);
    });

    test("writes log in case of error during unpacking", async () => {
        await expect(EtlModel.unpack(Buffer.alloc(5))).rejects.toThrowError();

        expect(mockLogger.error).toHaveBeenCalledWith("Unable to unpack EtlModel");
    });
    describe("downloadMetadata", () => {
        test("downloads and parse JSON", async () => {
            const resource = {
                Model: { data: "int32" },
            };
            const etlModel = new EtlModel(etlModelObj);
            mockResourceLoader.download.mockResolvedValueOnce(Buffer.from(JSON.stringify(resource)));

            const result = await etlModel.downloadMetadata();

            expect(result).toEqual(resource);
        });

        test("downloads and parse Protobuf", async () => {
            const etlModelWithProtobuf: IEtlModel = {
                type: EtlModelType.Custom,
                subtype: null,
                metadata: {
                    resourceContentType: ResourceContentType.PROTOBUF,
                    resource: {
                        type: ResourceType.Url,
                    },
                },
            };
            const resource = `syntax = "proto3"; message Model {int32 data = 1;}`;

            const etlModel = new EtlModel(etlModelWithProtobuf);
            mockResourceLoader.download.mockResolvedValueOnce(Buffer.from(resource));

            const result = await etlModel.downloadMetadata();

            expect(result).toEqual({
                Model: {
                    fields: {
                        data: {
                            id: 1,
                            type: "int32",
                        },
                    },
                },
            });
        });

        test("throws error if resource content type is not supported", async () => {
            const erroredEtlModel: IEtlModel = {
                type: EtlModelType.Custom,
                subtype: null,
                metadata: {
                    resourceContentType: "XML" as unknown as ResourceContentType,
                    resource: {
                        type: ResourceType.Url,
                    },
                },
            };

            const resource = `<xml>Hello</xml>`;

            const etlModel = new EtlModel(erroredEtlModel);
            mockResourceLoader.download.mockResolvedValueOnce(Buffer.from(resource));

            await expect(etlModel.downloadMetadata()).rejects.toThrowError(
                "Error during download and parsing resource: Resource content type XML is not supported",
            );
        });

        test("throws error if pasing an object is not possible", async () => {
            const resource = Buffer.alloc(5);

            const etlModel = new EtlModel(etlModelObj);
            mockResourceLoader.download.mockResolvedValueOnce(resource);

            await expect(etlModel.downloadMetadata()).rejects.toThrowError(
                "Error during download and parsing resource: JSON data in incorrect",
            );
        });

        test("throws an error if resource is empty", async () => {
            const resource = Buffer.from("");

            const etlModel = new EtlModel(etlModelObj);
            mockResourceLoader.download.mockResolvedValueOnce(resource);

            await expect(etlModel.downloadMetadata()).rejects.toThrowError(
                expect.objectContaining({
                    message: expect.stringContaining("Error during download and parsing resource: Resource is empty"),
                }),
            );
        });

        test("throws an error if protobuf message is incorrect", async () => {
            const resource = `syntax = "proto3"; message Model {int32 data`;

            const etlModel = new EtlModel({
                ...etlModelObj,
                metadata: {
                    ...etlModelObj.metadata,
                    resourceContentType: ResourceContentType.PROTOBUF,
                },
            });
            mockResourceLoader.download.mockResolvedValueOnce(resource);

            await expect(etlModel.downloadMetadata()).rejects.toThrowError(
                expect.objectContaining({
                    message: expect.stringContaining(
                        "Error during download and parsing resource: Protobuf message is incorrect",
                    ),
                }),
            );
        });
    });
});
