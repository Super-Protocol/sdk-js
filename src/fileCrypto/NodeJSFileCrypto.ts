import fs from "fs";
import crypto from "crypto";
import { once } from "events";
import { default as IFileCrypto } from "./IFileCrypto";
import {
    Encryption,
    AESEncryption,
    Encoding,
    CryptoAlgorithm,
} from "@super-protocol/sp-dto-js";

const getFileAlgorithm = (algo: CryptoAlgorithm): string | undefined => {
    switch (algo) {
        case CryptoAlgorithm.AES:
            return "aes-256-gcm";
        default:
            return undefined;
    }
};

class NodeJSFileCrypto implements IFileCrypto {
    /**
     * Encrypts file
     * @param inputFilepath - path to file that will be encrypted
     * @param outputFilepath - place where it will be saved
     * @param algorithm - file encryption algorithm
     * @param key – key that will be used to encrypt data
     * @param progressListener – listener for tracking encryption progress, useful for encrypting big file
     * @return Promise<Encryption> - encryption info
     */
    async encrypt(
        inputFilepath: string,
        outputFilepath: string,
        algorithm: CryptoAlgorithm,
        encoding: Encoding,
        key: string,
        progressListener?: (total: number, current: number) => void
    ): Promise<Encryption> {
        const fileAlgorithm = getFileAlgorithm(algorithm);
        if (typeof fileAlgorithm == "undefined") {
            throw Error(`Algorithm ${fileAlgorithm} is not supported`);
        }

        const iv = crypto.randomBytes(16);
        const reader = fs.createReadStream(inputFilepath);
        const writer = fs.createWriteStream(outputFilepath);
        const cph = crypto.createCipheriv(
            fileAlgorithm as crypto.CipherGCMTypes,
            Buffer.from(key, encoding),
            iv
        );

        let bytesWritten = 0;
        let total = (await fs.promises.stat(inputFilepath)).size;
        reader
            .pipe(cph)
            .on("data", (chunk) => {
                bytesWritten += chunk.length;
                if (typeof progressListener != "undefined") {
                    progressListener(total, bytesWritten);
                }
            })
            .pipe(writer);
        await once(writer, "finish");
        if (typeof progressListener != "undefined") {
            progressListener(total, total);
        }

        return {
            algo: algorithm,
            encoding: encoding,
            key: key,
            iv: iv.toString(encoding),
            authTag: cph.getAuthTag().toString(encoding),
        } as Encryption;
    }

    /**
     * Decrypts file
     * @param inputFilepath - path to file that will be encrypted
     * @param outputFilepath - place where it will be saved
     * @param encryption – encryption info
     * @param progressListener – listener for tracking encryption progress, useful for encrypting big file
     */
    async decrypt(
        inputFilepath: string,
        outputFilepath: string,
        encryption: Encryption,
        progressListener?: (total: number, current: number) => void
    ): Promise<void> {
        const fileAlgorithm = getFileAlgorithm(encryption.algo);
        if (typeof fileAlgorithm == "undefined") {
            throw Error(`Algorithm ${fileAlgorithm} is not supported`);
        }

        const info = encryption as AESEncryption;
        const iv = Buffer.from(info.iv, info.encoding);

        const reader = fs.createReadStream(inputFilepath);
        const writer = fs.createWriteStream(outputFilepath);
        const dcp = crypto.createDecipheriv(
            fileAlgorithm as crypto.CipherGCMTypes,
            Buffer.from(info.key, info.encoding),
            iv
        );
        dcp.setAuthTag(Buffer.from(info.mac, info.encoding));

        let bytesWritten = 0;
        let total = (await fs.promises.stat(inputFilepath)).size;
        reader
            .pipe(dcp)
            .on("data", (chunk) => {
                bytesWritten += chunk.length;
                if (typeof progressListener != "undefined") {
                    progressListener(total, bytesWritten);
                }
            })
            .pipe(writer);
        await once(writer, "finish");
        if (typeof progressListener != "undefined") {
            progressListener(total, total);
        }
    }
}

module.exports = NodeJSFileCrypto;
