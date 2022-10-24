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

const etlModelPacked =
    "CAES/gIfiwgAAAAAAAATRY3dUqNAEEbfhWt1l4gh8S5BfhYzSMgkgDdbM0wDCcJMhoEELN990a3Svuo6fb7+3jU1CNAe9Rut7ej3XoMijCiiPb5rElreyQws3ihoFP5yft9880/nf1Db4Zdo5dp/w+jl8OfJjrTpq+KSFIB/BH+i+fENBFHlhGiXVaB+tZ0AeVtDQW4/j3eKyLtinNRMAptqj+St/WriFTRTTLfECXl8nAVW2cp1oZsqWj33fF6nI0gvpAm+wphaYp5S5tS9kUeUby6e3iLPdtn9yg9LBwlSSLYNluj++iCNIIxi/3TAz9KpPH+RpIs6gyVhMwPxRo+3nn2x4zHFBzoProMxKdna2umZUEO9PgqTUZxQEtEUCcdZ5hdz17P1w9njxT7Hc1wne/OUbyjzvc6+9C2ZJeOZKndkpOz15TbjcXlO6op1Z9cphn4hXxs8untyXQwQrYK0ILpgaCMBTEO0pp+HVYaIhfhTTG2lfUzzD+8YngLQAQAA";

describe("EtlModel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("pack", async () => {
        const etlModel = new EtlModel(etlModelObj);
        const packed = await etlModel.pack();

        expect(packed).toEqual(Buffer.from(etlModelPacked, "base64"));
    });

    test("unpack", async () => {
        const etlModel = await EtlModel.unpack(Buffer.from(etlModelPacked, "base64"));

        expect({
            type: etlModel.getType(),
            subtype: etlModel.getSubtype(),
            metadata: etlModel.getMetadata(),
        }).toEqual(etlModelObj);
    });

    test("writes log in case of error during unpacking", async () => {
        await expect(EtlModel.unpack(Buffer.alloc(5))).rejects.toThrowError();

        expect(mockLogger.error).toHaveBeenCalledWith("Unable to unpack EtlModel");
    });
});
