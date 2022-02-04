import {
    CryptoAlgorithm,
    AESEncryption,
    Encoding,
    Encryption,
} from "@super-protocol/sp-dto-js";
import {
    createCipheriv,
    createDecipheriv,
    CipherGCMTypes,
    randomBytes,
} from "crypto";
import fs from "fs";
import { once } from "events";

class AES {
    public static async encrypt(
        key: string,
        content: string,
        encoding: Encoding = Encoding.base64
    ): Promise<AESEncryption> {
        const cipherName = "aes-256-gcm";

        const iv = randomBytes(16);
        const keyBuffer = Buffer.from(key, encoding);
        const cipher = createCipheriv(cipherName, keyBuffer, iv);

        let encrypted = cipher.update(content, "binary", encoding);
        encrypted += cipher.final(encoding);
        const mac = cipher.getAuthTag();

        return {
            key: key,
            algo: CryptoAlgorithm.AES,
            encoding,
            cipher: cipherName,
            iv: iv.toString(encoding),
            mac: mac.toString(encoding),
            ciphertext: encrypted,
        };
    }

    /**
     * Encrypts data stream
     * @param inputStream - path to file that will be encrypted
     * @param outputStream - place where it will be saved
     * @param algorithm - file encryption algorithm
     * @param key – key that will be used to encrypt data
     * @return Promise<Encryption> - encryption info
     */
    public static async encryptStream(
        inputStream: fs.ReadStream,
        outputStream: fs.WriteStream,
        algorithm: CryptoAlgorithm,
        encoding: Encoding,
        key: string
    ): Promise<AESEncryption> {
        const cipherName = "aes-256-gcm";

        const iv = randomBytes(16);
        const cph = createCipheriv(cipherName, Buffer.from(key, encoding), iv);

        inputStream.pipe(cph).pipe(outputStream);
        await once(outputStream, "finish");

        return {
            algo: algorithm,
            encoding: encoding,
            key: key,
            iv: iv.toString(encoding),
            mac: cph.getAuthTag().toString(encoding),
            cipher: cipherName,
        };
    }

    public static async decrypt(encryption: AESEncryption): Promise<string> {
        const key = Buffer.from(encryption.key, encryption.encoding);
        const iv = Buffer.from(encryption.iv, encryption.encoding);
        const mac = Buffer.from(encryption.mac, encryption.encoding);
        const decipher = createDecipheriv(
            encryption.cipher as CipherGCMTypes,
            key,
            iv
        );

        decipher.setAuthTag(mac);
        let decrypted = decipher.update(
            encryption.ciphertext!,
            encryption.encoding,
            "binary"
        );
        decrypted += decipher.final("binary");

        return decrypted;
    }

    /**
     * Decrypts data stream
     * @param inputStream - stream with data to decrypt
     * @param outputStream - stream where the decrypted data will be written
     * @param encryption – encryption info
     */
    public static async decryptStream(
        inputStream: fs.ReadStream,
        outputStream: fs.WriteStream,
        encryption: Encryption
    ): Promise<void> {
        const info = encryption as AESEncryption;
        const iv = Buffer.from(info.iv, info.encoding);

        const dcp = createDecipheriv(
            encryption.cipher as CipherGCMTypes,
            Buffer.from(info.key, info.encoding),
            iv
        );
        dcp.setAuthTag(Buffer.from(info.mac, info.encoding));

        inputStream.pipe(dcp).pipe(outputStream);
        await once(outputStream, "finish");
    }
}

export default AES;
