import { getCiphers, randomBytes } from "crypto";

import NativeCrypto from "../../src/crypto/nodejs/NativeCrypto";
import { Encoding } from "@super-protocol/dto-js";

const inputEncoding = "binary";
const outputEncoding = Encoding.base64;
const content: string = randomBytes(16).toString(inputEncoding);

describe("NativeCrypto", () => {
    for (const cipher of getCiphers()) {
        if (/wrap/.test(cipher)) {
            continue;
        }

        const key: Buffer = NativeCrypto.createKey(cipher);
        describe(cipher, () => {
            it("encrypt/decrypt string", async () => {
                const encrypted = NativeCrypto.encrypt(key, content, cipher, outputEncoding, inputEncoding);

                let params: any = {};
                if (encrypted.iv) {
                    params.iv = Buffer.from(encrypted.iv!, outputEncoding);
                }
                if (encrypted.mac) {
                    params.mac = Buffer.from(encrypted.mac!, outputEncoding);
                }

                let decrypted: string;
                decrypted = await NativeCrypto.decrypt(
                    key,
                    encrypted.ciphertext!,
                    cipher,
                    params,
                    outputEncoding,
                    inputEncoding,
                );

                expect(decrypted).toEqual(content);
            });
        });
    }
});
