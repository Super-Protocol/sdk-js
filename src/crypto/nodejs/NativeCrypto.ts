import { ReadStream, WriteStream } from "fs";
import {
    createCipher,
    createCipheriv,
    createDecipher,
    createDecipheriv,
    Cipher,
    CipherGCMOptions,
    Decipher,
    DecipherGCM,
    randomBytes,
    CipherGCM,
} from "crypto";
import { once } from "events";

import { Encoding, EncryptionWithMacIV } from "@super-protocol/dto-js";

/**
 *
 */
class NativeCrypto {
    /**
     * Here would be better to check cipher type using
     * ```
     * getCipherInfo(cipher)!.mode === 'mode'
     * ```
     * but it doesn't work in browser
     */
    public static readonly isCCM = (cipher: string): boolean => /ccm/i.test(cipher) || cipher === "chacha20-poly1305";
    public static readonly isGCM = (cipher: string): boolean => /gcm/i.test(cipher);
    public static readonly isOCB = (cipher: string): boolean => /ocb/i.test(cipher);
    public static readonly isECB = (cipher: string): boolean =>
        /ecb/i.test(cipher) || cipher === "des-ede" || cipher === "des-ede3";
    public static readonly isRC4 = (cipher: string): boolean => /^rc4/i.test(cipher);

    /**
     * Here would be better to check cipher type using
     * ```
     * getCipherInfo(cipher)!.keyLength
     * ```
     * but it doesn't work in browser
     */
    public static getKeyLength(cipher: string): number {
        if (/256\-xts/.test(cipher)) {
            return 64;
        }
        if (/256|128\-xts|chacha20/.test(cipher) && cipher !== "aes-128-cbc-hmac-sha256") {
            return 32;
        }
        if (/192|des\-ede3|desx|des3$/.test(cipher) || cipher === "id-smime-alg-cms3deswrap") {
            return 24;
        }
        if (/128|des\-ede/.test(cipher)) {
            return 16;
        }
        if (/64|des/.test(cipher)) {
            return 8;
        }
        if (/40/.test(cipher)) {
            return 5;
        }
        return 16;
    }

    /**
     * Here would be better to check cipher type using
     * ```
     * getCipherInfo(cipher)!.ivLength
     * ```
     * but it doesn't work in browser
     */
    public static getIVLength(cipher: string): number {
        if (this.isCCM(cipher) || this.isGCM(cipher) || this.isOCB(cipher)) {
            return 12;
        }
        if (/wrap\-pad/.test(cipher)) {
            return 4;
        }
        if (/wrap|cast|des|bf|blowfish|idea|rc2/.test(cipher)) {
            return 8;
        }
        return 16;
    }

    public static createKey(cipher: string): Buffer {
        const length: number = this.getKeyLength(cipher);
        return randomBytes(length);
    }
    public static createIV(cipher: string): Buffer {
        const length: number = this.getIVLength(cipher);
        return randomBytes(length);
    }

    public static createCipher(cipher: string, key: Buffer, iv: Buffer): Cipher {
        if (this.isECB(cipher) || this.isRC4(cipher)) {
            return createCipher(cipher, key);
        }
        if (this.isCCM(cipher) || this.isOCB(cipher)) {
            const options: CipherGCMOptions = {
                authTagLength: 16,
            };
            return createCipheriv(cipher, key, iv, options);
        }
        return createCipheriv(cipher, key, iv);
    }
    public static createDecipher(cipher: string, key: Buffer, iv?: Buffer, mac?: Buffer): Decipher {
        if (iv) {
            const options: CipherGCMOptions = {};
            if (this.isCCM(cipher) || this.isOCB(cipher)) {
                options.authTagLength = 16;
            }
            const decipher: DecipherGCM = createDecipheriv(cipher, key, iv, options) as DecipherGCM;
            if (mac) {
                decipher.setAuthTag(mac);
            }
            return decipher;
        } else {
            return createDecipher(cipher, key);
        }
    }

    public static encrypt(
        key: Buffer,
        content: string,
        cipherName: string,
        outputEncoding: Encoding = Encoding.base64,
        // TODO: replace BufferEncoding with Encoding
        inputEncoding: BufferEncoding = "binary",
    ): Partial<EncryptionWithMacIV> {
        const iv: Buffer = this.createIV(cipherName);
        const result: Partial<EncryptionWithMacIV> = {};

        const cipher: Cipher = this.createCipher(cipherName, key, iv);

        result.ciphertext = cipher.update(content, inputEncoding, outputEncoding);
        result.ciphertext += cipher.final(outputEncoding);

        if (!this.isECB(cipherName) && !this.isRC4(cipherName)) {
            result.iv = iv.toString(outputEncoding);
        }
        if (this.isCCM(cipherName) || this.isGCM(cipherName) || this.isOCB(cipherName)) {
            result.mac = (cipher as CipherGCM).getAuthTag().toString(outputEncoding);
        }

        return result;
    }

    public static async encryptStream(
        key: Buffer,
        inputStream: ReadStream,
        outputStream: WriteStream,
        cipherName: any,
        encoding: Encoding = Encoding.base64,
    ): Promise<Partial<EncryptionWithMacIV>> {
        const iv: Buffer = this.createIV(cipherName);
        const result: Partial<EncryptionWithMacIV> = {};

        const cipher: Cipher = this.createCipher(cipherName, key, iv);

        inputStream.pipe(cipher).pipe(outputStream);
        await once(outputStream, "finish");

        result.iv = iv.toString(encoding);
        if (this.isCCM(cipherName) || this.isGCM(cipherName)) {
            result.mac = (cipher as CipherGCM).getAuthTag().toString(encoding);
        }

        return result;
    }

    public static decrypt(
        key: Buffer,
        content: string,
        cipherName: string,
        params?: {
            iv: Buffer;
            mac?: Buffer;
        },
        inputEncoding: Encoding = Encoding.base64,
        // TODO: replace BufferEncoding with Encoding
        outputEncoding: BufferEncoding = "binary",
    ): string {
        const decipher: Decipher = this.createDecipher(cipherName, key, params?.iv, params?.mac);

        let decrypted: string = decipher.update(content, inputEncoding, outputEncoding);
        decrypted += decipher.final(outputEncoding);

        return decrypted;
    }

    public static async decryptStream(
        key: Buffer,
        inputStream: ReadStream,
        outputStream: WriteStream,
        cipherName: string,
        params?: {
            iv: Buffer;
            mac: Buffer;
        },
    ): Promise<void> {
        const decipher: Decipher = this.createDecipher(cipherName, key, params?.iv, params?.mac);

        inputStream.pipe(decipher).pipe(outputStream);
        await once(outputStream, "finish");
    }
}

export default NativeCrypto;
