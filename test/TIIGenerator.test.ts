import { OfferInfo, OrderInfo, TeeOfferInfo } from "../src";
import TIIGenerator from "../src/TIIGenerator";
import {
    CryptoAlgorithm,
    StorageType,
    ResourceType,
    Resource,
    StorageProviderResource,
} from "@super-protocol/sp-dto-js";

const fileEncryptionAlgo = CryptoAlgorithm.AES;
const key = "345";

const argsPublicKeyAlgo = "ECIES";
const argsPrivateKey =
    "e96e82fa66724817ec14a8e2bb7b8e5ec165070775bd70cbf102470dd1a5cf9b";
const argsPrivateKeyIncorrect =
    "290ff4d20071c88a60c81ef709bc5a762ed366224a229ca4ac230e53f1524644";
const argsPublicKey =
    "04795681c5a781c1b118ca32ff1beb8b9a98d1a79d744b7924c9d0a6c3594126db7753827cf2ce9cb0dad09e678687c0fbfefc0db05d069a3683a5de0cf4066560";

const tii = JSON.stringify({
    encryptedResource:
        '{"iv":"REqqjKIdx9ytnjk71I/4eg==","ephemPublicKey":"BL0I9Ti7GLp1XPP4cc0qQkdI2Vs/DyL6GbNbiLZjxYmUnNdtL9+ieTVU/XWfm8ARoy3h5eqcisdf9rKl0ZhrWyU=","ciphertext":"YG65UaQYBsBKcjTZd75LLTbLIkjYKn8x+3xS4cw1OWIEw2aZS2MqeH8zaPaI8+O/FXraNScBGzK0VxO3Vn60rsF9f3OCrrYnI+qsQU2fEbrekZMBDR8uXGjZApWGKUTn+FutCSIk5T0hi9l4pTg/rw==","mac":"iM+7WOP3UrQ4ghWkC5aVisqiLUBWyuRAfem/JnP1whA="}',
    tri: '{"iv":"SqBK++mjTrrtvX2s32csTg==","ephemPublicKey":"BMCk3HeI7e7cTn7L1Lorx7JR13v5FXiITM50EBfPNyNrUNUyscaJ9eMqJx02uOeGuQWVYPP15SzhrXLlPnS7LCY=","ciphertext":"JmJ8VlsvwFAlh6QwyLSM8+KhcGCjKeWuG+nfOtA7/znEWgL407mDlY9fPU7Wwdu5BVf5ttG7+0QWNy7pQmRRBkxXqfhfj6hmz+1o0/c9hj+Nn4ryTB+zfM2eAga/pfxxkezC18GMdSMFoiB6LfIkbGKxHhPs/hWX2niOlCa+QQY=","mac":"JvaaxIKN8XaeFDBG+7lWrTAQikPOZIw2JtTUtzoNTEU="}',
});

jest.mock("../src/models/Order", () => {
    return jest.fn().mockImplementation((address) => {
        if (
            address !== "order" &&
            address !== "parentOrder" &&
            address !== "teeOrder"
        ) {
            throw new Error("Order doesnot exists");
        }
        return {
            async getParentOrder() {
                return address === "teeOrder" ? null : "parentOrder";
            },
            async getOrderInfo() {
                return {
                    offer: "",
                    args: {
                        inputOffers: ["offer"],
                    },
                } as OrderInfo;
            },
        };
    });
});

jest.mock("../src/models/Offer", () => {
    return jest.fn().mockImplementation(() => {
        return {
            async getInfo() {
                return {
                    hash: "875e64e17e414b21b4a029bf88ff2ba0",
                    hashAlgo: "MD5",
                } as OfferInfo;
            },
        };
    });
});

jest.mock("../src/models/TeeOffer", () => {
    return jest.fn().mockImplementation(() => {
        return {
            async getInfo() {
                return {
                    argsPublicKey,
                    argsPublicKeyAlgo,
                } as TeeOfferInfo;
            },
        };
    });
});

describe("TIIGenerator", () => {
    let resource!: Resource;
    let fileEncryptoAlgoDeps!: any;

    beforeEach(() => {
        resource = {
            type: ResourceType.StorageProvider,
            storageType: StorageType.StorJ,
            filepath: "/foo/bar",
            credentials: {
                token: "abc",
            },
        } as StorageProviderResource;

        fileEncryptoAlgoDeps = {
            iv: "123",
            authTag: "345",
        };
    });

    describe("generateByOffer", () => {
        test("generate TII", async () => {
            const tii = await TIIGenerator.generateByOffer(
                "offer",
                [],
                resource,
                {},
                {
                    algo: fileEncryptionAlgo,
                    encoding: "base64",
                    key: key,
                    ...fileEncryptoAlgoDeps,
                }
            );

            expect(typeof tii).toBe("string");

            const tiiObj = JSON.parse(tii);

            expect(tiiObj).toHaveProperty("encryptedResource");
            expect(tiiObj).toHaveProperty("tri");
        });
    });

    describe("generate", () => {
        test("generate TII", async () => {
            const tii = await TIIGenerator.generate(
                "order",
                resource,
                {},
                {
                    algo: fileEncryptionAlgo,
                    encoding: "base64",
                    key: key,
                    ...fileEncryptoAlgoDeps,
                }
            );

            expect(typeof tii).toBe("string");

            const tiiObj = JSON.parse(tii);

            expect(tiiObj).toHaveProperty("encryptedResource");
            expect(tiiObj).toHaveProperty("tri");
        });

        test("fail for no Order", async () => {
            expect(
                TIIGenerator.generate(
                    "badOrder",
                    resource,
                    {},
                    {
                        algo: fileEncryptionAlgo,
                        encoding: "base64",
                        key: key,
                        ...fileEncryptoAlgoDeps,
                    }
                )
            ).rejects.toThrowError();
        });

        test("fail for no parent Order", async () => {
            expect(
                TIIGenerator.generate(
                    "teeOrder",
                    resource,
                    {},
                    {
                        algo: fileEncryptionAlgo,
                        encoding: "base64",
                        key: key,
                        ...fileEncryptoAlgoDeps,
                    }
                )
            ).rejects.toThrowError();
        });
    });

    describe("getTRI", () => {
        test("get TRI", async () => {
            const tri = await TIIGenerator.getTRI(
                tii,
                argsPrivateKey,
                argsPublicKeyAlgo
            );

            expect(tri).toHaveProperty("solutionHashes");
            expect(tri).toHaveProperty("args");
            expect(tri).toHaveProperty("encryption");
            expect(tri.encryption).toEqual({
                algo: fileEncryptionAlgo,
                encoding: "base64",
                key: key,
                ...fileEncryptoAlgoDeps,
            });
        });

        test("incorrect encription key", async () => {
            expect(
                TIIGenerator.getTRI(
                    tii,
                    argsPrivateKeyIncorrect,
                    argsPublicKeyAlgo
                )
            ).rejects.toThrowError();
        });
    });

    describe("getResource", () => {
        test("get resource", async () => {
            const resource = await TIIGenerator.getResource(
                tii,
                argsPrivateKey,
                argsPublicKeyAlgo
            );

            expect(resource).toEqual(resource);
        });

        test("incorrect encription key", async () => {
            expect(
                TIIGenerator.getResource(
                    tii,
                    argsPrivateKeyIncorrect,
                    argsPublicKeyAlgo
                )
            ).rejects.toThrowError();
        });
    });
});
