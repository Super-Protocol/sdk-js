import {OfferInfo, OfferType, OrderInfo, TeeOfferInfo} from "../src";
import TIIGenerator from "../src/TIIGenerator";
import {
    CryptoAlgorithm,
    Encoding,
    Resource,
    ResourceType,
    StorageProviderResource,
    StorageType,
} from "@super-protocol/sp-dto-js";

const fileEncryptionAlgo = CryptoAlgorithm.AES;
const key = "345";

const argsPrivateKey =
    "6W6C+mZySBfsFKjiu3uOXsFlBwd1vXDL8QJHDdGlz5s=";
const argsPrivateKeyIncorrect =
    "KQ/00gBxyIpgyB73Cbxadi7TZiJKIpykrCMOU/FSRkQ=";
const argsPublicKey = JSON.stringify({
    key: "BHlWgcWngcGxGMoy/xvri5qY0aeddEt5JMnQpsNZQSbbd1OCfPLOnLDa0J5nhofA+/78DbBdBpo2g6XeDPQGZWA=",
    algo: CryptoAlgorithm.ECIES,
    encoding: Encoding.base64,
});

const tii = JSON.stringify({
    encryptedResource: {
        iv: 'e2Cp6uVK8wCoZNKzGIMpYQ==',
        ephemPublicKey: 'BPBoD/AafUCu5WbFMzkwqR53ygHEoYPeRcYsXGYK6nkuXMsRggmbd9B8pgo6bbaQFzbCW4kyLPyP1MPgjvbKKgo=',
        mac: 'kzRH+Qgeih2V2RTRrikWQEGPRgcHwvpsPZyqmLwbh80=',
        encoding: 'base64',
        algo: 'ECIES',
        ciphertext: 'Z9fyGL8xkIUeR9zxw9UGvn988fIhbDPy7pqRv5vlQs7dK8SFzHGR2QdmK4zovw2PsyRnfaybJi/BQV8MPmqFil/xBHlLPRxvKsosux8WqKzEGIauyJEke8dUQes6qdPLHMBOB6LfQkhFyk1akLXvSQ=='
    },
    tri: {
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
                    linkage: JSON.stringify({
                        encoding: Encoding.base64,
                        mrenclave: "",
                    }),
                    restrictions: {
                        offers: [ "offer" ],
                        types: [ OfferType.Storage ],
                    },
                    hash: JSON.stringify({
                        encoding: "hex",
                        algo: "md5",
                        hash: "875e64e17e414b21b4a029bf88ff2ba0"
                    }),
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
                    tlb: "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",
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
                JSON.stringify({
                    encoding: Encoding.base64,
                    mrenclave: '',
                }),
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
        // test("get TRI", async () => {
        //     const tri = await TIIGenerator.getTRI(
        //         tii,
        //         Buffer.from(argsPrivateKey, 'base64')
        //     );

        //     expect(tri).toHaveProperty("solutionHashes");
        //     expect(tri).toHaveProperty("args");
        //     expect(tri).toHaveProperty("encryption");
        //     expect(tri.encryption).toEqual({
        //         algo: fileEncryptionAlgo,
        //         encoding: "base64",
        //         key: key,
        //         ...fileEncryptoAlgoDeps,
        //     });
        // });

        test("incorrect encription key", async () => {
            expect(
                TIIGenerator.getTRI(
                    tii,
                    Buffer.from(argsPrivateKeyIncorrect, 'base64'),
                )
            ).rejects.toThrowError();
        });
    });

    describe("getResource", () => {
        test("get resource", async () => {
            const resource = await TIIGenerator.getResource(
                tii,
                Buffer.from(argsPrivateKey, 'base64'),
            );

            expect(resource).toEqual(resource);
        });

        test("incorrect encription key", async () => {
            expect(
                TIIGenerator.getResource(
                    tii,
                    Buffer.from(argsPrivateKeyIncorrect, 'base64'),
                )
            ).rejects.toThrowError();
        });
    });
});
