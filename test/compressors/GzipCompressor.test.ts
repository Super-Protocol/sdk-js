import { GzipCompressor } from "../../src/utils/compressors";

const testData = {
    number: 100500,
    string: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
};

const uncompressed = Buffer.from(JSON.stringify(testData));

const gzippedTestData =
    "H4sIAAAAAAAAEzVQO27DMAy9yoPnwHCHLpnbrWsPwEh0SkC/SGQQIOjdS9XtJop83+dSLF+4L+eXbXvdttMytEu5Luflo3bOkDYsI9ZUO4YoKLOeEGoZHJTVOihKkxEcBE7iy8HRAWCxkWuEcm4OlhIkSrSiMEWii9OD9aBmZLoWAiW5Ga34VHCR7NzIMh93HymfcDMZKNVNWgQ/uAdRUqkFlhLlUA/meSRDptIvpTQ/BpMbz+6pHgFcSle8TUoyZUg3d3JklYLOrfMXl8jdg/vHvSZrLsdux5OCx2AESem/IQ9k2O0qpCjTEBp1H6yveH8Ebso2a/QOagjEwe+CNYmkE+EpWq8SucwWZ1MuGiw1mrlR912CECIP7nOba5o2aBYkXsf469Xyunz/AJQwgbjaAQAA";

describe("GzipCompressor", () => {
    const gzipCompressor = new GzipCompressor();

    test("compress", async () => {
        const compressed = await gzipCompressor.compress(testData);

        expect(compressed).toBeInstanceOf(Buffer);
        expect(compressed.byteLength).toBeLessThan(uncompressed.byteLength);
        expect(compressed.toString("base64")).toEqual(gzippedTestData);
    });

    test("decompress", async () => {
        const compressed = Buffer.from(gzippedTestData, "base64");
        const decompressed = await gzipCompressor.decompress(compressed);

        expect(decompressed).toEqual(testData);
    });
});
