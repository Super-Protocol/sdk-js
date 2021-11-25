import Crypto from "../src/Crypto";

const rsaPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
MIICWwIBAAKBgG0Bpb0BMgdCnKvuAJKB9qGDwXokta0sGrExwQFMTmW48r2hM28Y
SWkyJ+tLiF+4K44vO8p0z93IOjauBflvGhrf2jOkcN9k8eGLMcfOAw5v9/ajo53Z
tQtTRaai0UyL6r9Qys1hXBmUeH8I5DawqUuxiSnNde/ESZiSbtIiaUWbAgMBAAEC
gYAHkqq6A8A/AuCxjRpbE05YEDg7zRsWCc9c6hD3jx6PMJckl3NkT3KiLUrarOev
hrL38M4dlZnvVX69178wggh1J/H8d9QlZ7U1LxNjLfC/5HJqSzGMQrkTEMkz4p3P
jzbvslkVv7Yp3bl33rWjpi4QRW7LKMtNoyD4rrSWBtGlaQJBAMbIQKydvKbFUFF2
OrgpKgTWrs9UZOSBUaJi+QGZ/aoFcDuyJSJWuVf34f/VUhdmTx1BChY4/KEcTQZq
4G6GuXcCQQCMYgyBYHn1aRLBfOZ3oh/zkyd2+2tSWc19l3coAin/DKwtgs7F24LE
C8wWTI2usz70e16LTI53psFcJsN2Kp39AkEAiQ4VGW8AXXP59tCvl746DHAAw06K
6coIARCAYwxLi2iIg4BGfjCRRgfRONVZ7mxJ6/+l9sB/3o1mxh/2cf5N7QJAaEdl
Fq29qmiUwBmxcOiDZ4HF7QIx5IhEtqhOoO+KlqSpOV1Tj3HRnyNMRLw0+rK3bxA9
WKhTo9nBBFzfEOXzWQJAAb+HO8do51pzuGf1AKmOHrf//lHxrOHML4iNJQJrEX80
Ifbeq7dDnuaQ8MAQWy3lgAZP/ZewWPxPC2MnWXXiHw==
-----END RSA PRIVATE KEY-----`;
const rsaPublicKey = `-----BEGIN PUBLIC KEY-----
MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgG0Bpb0BMgdCnKvuAJKB9qGDwXok
ta0sGrExwQFMTmW48r2hM28YSWkyJ+tLiF+4K44vO8p0z93IOjauBflvGhrf2jOk
cN9k8eGLMcfOAw5v9/ajo53ZtQtTRaai0UyL6r9Qys1hXBmUeH8I5DawqUuxiSnN
de/ESZiSbtIiaUWbAgMBAAE=
-----END PUBLIC KEY-----`;
const rsaPrivateKeyIncorrect = `-----BEGIN RSA PRIVATE KEY-----
MIICWgIBAAKBgH5XN8iGs4zsjnjMz1zUAQFIBbfmbPRvsuYDnyFiICQfFrW45EJV
uRMRDtXKue+wlJLEqp8ySHFJuiZVqeJ4aYkN6G3ZyTozfxXNot2IQLCbD8bFOcme
fj7ZBVCTNIUSQ9JDg1E2W2VLcrKg1qnDYOZ5l3LeSr3UfWMLRpwVGKxxAgMBAAEC
gYANRNW7/sGuxE12THRe2Hk+jDTlipLY3T5Zv/mfhPHBOW6mKUP3347vfLQlKgR7
Mv13qKYO0DYhh8/AJPERsvnKXnExOS+zg53Uvv2fTtoVsUtH3mNdtEwJZTstVrA+
FFHi/0NdbKg68FxAGfpXpUMjwpY8wxNCp4SMbDXx8EgoUQJBAPdK1aIEXczvCx+v
I2Uid8bGn2hK+GnZL2Tu1jbmO+bnDILmO1jaquaeWdE/I3HUUQ6vnqkstPrT8/CP
nIF383UCQQCCyhcIPTET1RiFnv156X/HkRRCEhwpiJ589KX0s5I7nfXM37W4ZaEe
J9QF6ht6PxKLmTCVX0gDKWrpFejX36GNAkBTcIOu3CxONqYZNb4KpNunTWOCDDHP
fUG5m8DZ20uA+JrHHCoQLBAYKnwB13z9Lnd/LhCp4nTaYWPg2oQjRzb1AkA2QQLA
5jFfmrwrYcKgOd5JuMMAjWalTAkCqLHXCk6U8HewXvSQ44esbLUlJvHzCgr1Ybyn
mfjTZvD0c6Q9OIVZAkBRwpdfUdcHlca7zof5LlVaz4TfbjlH/8VjWQOkU/BSakBC
owo6lyCYNeUtdCbO1yfzfEa/mrUGCLC/Ikjk1r19
-----END RSA PRIVATE KEY-----`;

const eccPrivateKey = "e96e82fa66724817ec14a8e2bb7b8e5ec165070775bd70cbf102470dd1a5cf9b";
const eccPublicKey =
    "04795681c5a781c1b118ca32ff1beb8b9a98d1a79d744b7924c9d0a6c3594126db7753827cf2ce9cb0dad09e678687c0fbfefc0db05d069a3683a5de0cf4066560";
const eccPrivateKeyIncorrect = "290ff4d20071c88a60c81ef709bc5a762ed366224a229ca4ac230e53f1524644";

const data = "I am secret data!";

describe("OrdersController", () => {
    describe("RSA-Hybrid", () => {
        test("correct", async () => {
            const encrypted = await Crypto.encrypt("RSA-Hybrid", data, rsaPublicKey);
            const decrypted = await Crypto.decrypt("RSA-Hybrid", encrypted, rsaPrivateKey);

            // console.log(encrypted);

            expect(decrypted).toEqual(data);
            expect(encrypted).not.toContain(data);
        });

        test("incorrect data", async () => {
            let encrypted = await Crypto.encrypt("RSA-Hybrid", data, rsaPublicKey);

            // Replace center of encrypted content to random characters
            const replacePosition = encrypted.length / 2;
            encrypted = encrypted.substring(0, replacePosition) + 'oRHAW7' + encrypted.substring(replacePosition + 6);

            await expect(Crypto.decrypt("RSA-Hybrid", encrypted, rsaPrivateKey)).rejects.toThrowError();
        });

        test("incorrect keys", async () => {
            const encrypted = await Crypto.encrypt("RSA-Hybrid", data, rsaPublicKey);
            await expect(Crypto.decrypt("RSA-Hybrid", encrypted, rsaPrivateKeyIncorrect)).rejects.toThrowError();
        });
    });

    describe("ECIES", () => {
        test("correct", async () => {
            const encrypted = await Crypto.encrypt("ECIES", data, eccPublicKey);
            const decrypted = await Crypto.decrypt("ECIES", encrypted, eccPrivateKey);

            console.log(encrypted);

            expect(decrypted).toEqual(data);
            expect(encrypted).not.toContain(data);
        });

        test("incorrect data", async () => {
            let encrypted = await Crypto.encrypt("ECIES", data, eccPublicKey);

            // Replace center of encrypted content to random characters
            const replacePosition = encrypted.length / 2;
            encrypted = encrypted.substring(0, replacePosition) + 'oRHAW7' + encrypted.substring(replacePosition + 6);

            await expect(Crypto.decrypt("ECIES", encrypted, eccPrivateKey)).rejects.toThrowError();
        });

        test("incorrect keys", async () => {
            const encrypted = await Crypto.encrypt("ECIES", data, eccPublicKey);

            await expect(Crypto.decrypt("ECIES", encrypted, eccPrivateKeyIncorrect)).rejects.toThrowError();
        });
    });
});
