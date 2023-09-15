import { QuoteValidator } from "../../src/tee/QuoteValidator";
import { testQuotes } from "./examples";

describe("Test quotes validation", () => {
    const validator = new QuoteValidator();

    // test("quote1", async () => {
    //     const res = await validator.validate(testQuotes[0]);
    //     console.log({ res });
    //     expect(res).toBeDefined();
    // });

    // test("quote2", async () => {
    //     const res = await validator.validate(testQuotes[1]);
    //     console.log({ res });
    //     expect(res).toBeDefined();
    // });

    test("quote3", async () => {
        const res = await validator.validate(testQuotes[2]);
        expect(res).toBeDefined();
    });
});
