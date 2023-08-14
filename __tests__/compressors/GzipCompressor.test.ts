import { GzipCompressor } from "../../src/utils/compressors";

const testData = {
    number: 100500,
    string: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
};

const uncompressed = Buffer.from(JSON.stringify(testData));

describe("GzipCompressor", () => {
    const gzipCompressor = new GzipCompressor();

    test("compress and decompress", async () => {
        const compressed = await gzipCompressor.compress(testData);

        expect(compressed).toBeInstanceOf(Buffer);
        expect(compressed.byteLength).toBeLessThan(uncompressed.byteLength);

        const decompressed = await gzipCompressor.decompress(compressed);
        expect(decompressed).toEqual(testData);
    });
});
