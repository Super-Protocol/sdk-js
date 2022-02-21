import {
    ReadStream,
    WriteStream,
} from 'fs';
import {
    createCipher,
    createCipheriv,
    createDecipher,
    createDecipheriv,
    Cipher,
    CipherGCMOptions,
    CipherInfo,
    Decipher,
    DecipherGCM,
    getCipherInfo,
    randomBytes, CipherGCM,
} from 'crypto';
import { once } from "events";

import {
    Encoding,
    EncryptionWithMacIV,
} from "@super-protocol/sp-dto-js";

/**
 *
 */
class NativeCrypto {
    public static readonly isCCM = (cipher: string): boolean => getCipherInfo(cipher)?.mode === 'ccm' || cipher === 'chacha20-poly1305';
    public static readonly isGCM = (cipher: string): boolean => getCipherInfo(cipher)?.mode === 'gcm';
    public static readonly isOCB = (cipher: string): boolean => getCipherInfo(cipher)?.mode === 'ocb';
    public static readonly isECB = (cipher: string): boolean => getCipherInfo(cipher)?.mode === 'ecb';
    public static readonly isRC4 = (cipher: string): boolean => /^rc4/.test(cipher);

    public static createKey(cipher: string): Buffer {
        const info: CipherInfo | undefined = getCipherInfo(cipher);
        return randomBytes(info?.keyLength ?? 16);
    }
    public static createIV(cipher: string): Buffer {
        const info: CipherInfo | undefined = getCipherInfo(cipher);
        return randomBytes(info?.ivLength ?? 16);
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
        inputEncoding: BufferEncoding = 'binary',
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

    public static async decrypt(
        key: Buffer,
        content: string,
        cipherName: string,
        params?: {
            iv: Buffer,
            mac?: Buffer,
        },
        inputEncoding: Encoding = Encoding.base64,
        // TODO: replace BufferEncoding with Encoding
        outputEncoding: BufferEncoding = 'binary',
    ): Promise<string> {
        const decipher: Decipher = this.createDecipher(
            cipherName,
            key,
            params?.iv,
            params?.mac,
        );

        let decrypted: string = decipher.update(
            content,
            inputEncoding,
            outputEncoding,
        );
        decrypted += decipher.final(outputEncoding);

        return decrypted;
    }

    public static async decryptStream(
        key: Buffer,
        inputStream: ReadStream,
        outputStream: WriteStream,
        cipherName: string,
        params?: {
            iv: Buffer,
            mac: Buffer,
        },
    ): Promise<void> {
        const decipher: Decipher = this.createDecipher(
            cipherName,
            key,
            params?.iv,
            params?.mac,
        );

        inputStream.pipe(decipher).pipe(outputStream);
        await once(outputStream, "finish");
    }
}

export default NativeCrypto;
