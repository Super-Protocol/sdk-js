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

const argsPublicKeyAlgo = CryptoAlgorithm.ECIES;
const argsPrivateKey =
    "6W6C+mZySBfsFKjiu3uOXsFlBwd1vXDL8QJHDdGlz5s=";
const argsPrivateKeyIncorrect =
    "KQ/00gBxyIpgyB73Cbxadi7TZiJKIpykrCMOU/FSRkQ=";
const argsPublicKey =
    "BHlWgcWngcGxGMoy/xvri5qY0aeddEt5JMnQpsNZQSbbd1OCfPLOnLDa0J5nhofA+/78DbBdBpo2g6XeDPQGZWA=";

const tii = JSON.stringify({
    encryptedResource: {
        key: 'BHlWgcWngcGxGMoy/xvri5qY0aeddEt5JMnQpsNZQSbbd1OCfPLOnLDa0J5nhofA+/78DbBdBpo2g6XeDPQGZWA=',
        iv: 'e2Cp6uVK8wCoZNKzGIMpYQ==',
        ephemPublicKey: 'BPBoD/AafUCu5WbFMzkwqR53ygHEoYPeRcYsXGYK6nkuXMsRggmbd9B8pgo6bbaQFzbCW4kyLPyP1MPgjvbKKgo=',
        mac: 'kzRH+Qgeih2V2RTRrikWQEGPRgcHwvpsPZyqmLwbh80=',
        encoding: 'base64',
        algo: 'ECIES',
        ciphertext: 'Z9fyGL8xkIUeR9zxw9UGvn988fIhbDPy7pqRv5vlQs7dK8SFzHGR2QdmK4zovw2PsyRnfaybJi/BQV8MPmqFil/xBHlLPRxvKsosux8WqKzEGIauyJEke8dUQes6qdPLHMBOB6LfQkhFyk1akLXvSQ=='
    },
    tri: {
        key: 'BHlWgcWngcGxGMoy/xvri5qY0aeddEt5JMnQpsNZQSbbd1OCfPLOnLDa0J5nhofA+/78DbBdBpo2g6XeDPQGZWA=',
        iv: 'F+57GgUONXqvaiHN6yM5cg==',
        ephemPublicKey: 'BMtORnAIFortwlLIU9GBeWPoRA65tavpKGPqm4rJIlBlaSD9eCqIUXPXmAaxQxVdX2OGy7Rv1KS2sfSaYua20ac=',
        mac: '5aasrr1PNS5bV50Htyonqf9XLl0y8xReWa9HKEumF+0=',
        encoding: 'base64',
        algo: 'ECIES',
        ciphertext: 'o9wTrXjWP7ra8RG+17WiDphUlIEVcoiB8lsXJ0gpLXZL0MfLA6J1R35nMIoQaAiDN5Fiu99OU4lh7IGuZULWlkNvAAZYaJMr43SNbGKvlXbUmx1cAfKmNpce62i3tYqN/mp8LFfjpP+xlBhNFG+WvWWZUpNIk6ndYwUHuTaUspg='
    }
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

            console.log(JSON.parse(tii));
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
                argsPrivateKey
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
                )
            ).rejects.toThrowError();
        });
    });

    describe("getResource", () => {
        test("get resource", async () => {
            const resource = await TIIGenerator.getResource(
                tii,
                argsPrivateKey,
            );

            expect(resource).toEqual(resource);
        });

        test("incorrect encription key", async () => {
            expect(
                TIIGenerator.getResource(
                    tii,
                    argsPrivateKeyIncorrect,
                )
            ).rejects.toThrowError();
        });
    });
});
