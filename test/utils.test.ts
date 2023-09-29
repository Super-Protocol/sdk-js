import { formatBytes32String, parseBytes32String } from "ethers/lib/utils";
import { tupleToObject } from "../src/utils/helper";

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
});
