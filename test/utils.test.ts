import { formatBytes32String, parseBytes32String } from "ethers/lib/utils";
import { tupleToObject, formatHexStringToBytes32, parseBytes32toHexString } from "../src/utils";

describe("utils", () => {
    describe("tupleToObject", () => {
        enum MockEnum {
            New = "0",
            Done = "1",
        }
        const MockType = {
            id: String,
            externalId: parseBytes32String,
            status: MockEnum,
        };

        it("should tupleToObject", () => {
            const expectedResult = { id: "1", externalId: "12345", status: MockEnum.New };
            const result = tupleToObject(["1", formatBytes32String("12345"), MockEnum.New], MockType);
            expect(result).toEqual(expectedResult);
        });
    });
    describe("bytes32 <-> hex", () => {
        const mockedBytes = [
            "0x3000000000000000000000000000000000000000000000000000000000000000",
            "0x3031303230333034303530363037303830393061306230633064306530663130",
            "0x6666666666666666666666666666666666666666666666666666666666666666",
        ];
        const mockedHexes = ["0", "0102030405060708090a0b0c0d0e0f10", "ffffffffffffffffffffffffffffffff"];

        const invalidBytes = [
            "0x6000000000000000000000000000000000000000000000000000000000000000",
            "0x21402324255e0000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000000",
        ];
        const invalidHex = ["`", "!@#$%^", ""];

        it("Parse bytes32 to hex", () => {
            for (let bytesIndex = 0; bytesIndex < mockedBytes.length; bytesIndex++) {
                expect(parseBytes32toHexString(mockedBytes[bytesIndex])).toEqual(mockedHexes[bytesIndex]);
            }
            for (let bytesIndex = 0; bytesIndex < invalidBytes.length; bytesIndex++) {
                expect(() => {
                    parseBytes32toHexString(invalidBytes[bytesIndex]);
                }).toThrow("parsed value - is not a hex");
            }
        });
        it("Format hex to bytes32", () => {
            for (let hexIndex = 0; hexIndex < mockedHexes.length; hexIndex++) {
                expect(formatHexStringToBytes32(mockedHexes[hexIndex])).toEqual(mockedBytes[hexIndex]);
            }
            for (let hexIndex = 0; hexIndex < invalidHex.length; hexIndex++) {
                expect(() => {
                    formatHexStringToBytes32(invalidHex[hexIndex]);
                }).toThrow("formatted value - is not a hex");
            }
        });
    });
});
