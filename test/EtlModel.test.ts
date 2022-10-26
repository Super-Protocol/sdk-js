import { EtlModel as IEtlModel, Resource, ResourceType, StorageType } from "@super-protocol/dto-js";
import { EtlModelImageSubtype, EtlModelType } from "@super-protocol/dto-js/build/enum/EtlModel.enum";
import { ResourceContentType } from "@super-protocol/dto-js/build/enum/ResourceContentType.enum";

const mockLogger = {
    child: jest.fn().mockReturnThis(),
    error: jest.fn(),
};
jest.mock("../src/logger", () => mockLogger);

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
});
