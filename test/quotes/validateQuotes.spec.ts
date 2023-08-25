import { QuoteValidator } from "../../src/tee/QuoteValidator";
import { testQuotes } from "./examples";

describe.only("Test quotes validation", () => {
    const validator = new QuoteValidator();

    test("", () => {
        const res = validator.validate(testQuotes[0]);
    });
});
