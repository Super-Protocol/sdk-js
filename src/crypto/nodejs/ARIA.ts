import {
    CryptoAlgorithm,
    ARIAEncryption,
    ARIAEncryptionWithMac,
    Encoding,
    Cipher, Encryption,
} from "@super-protocol/dto-js";
import {
    ReadStream,
    WriteStream,
} from "fs";

import NativeCrypto from './NativeCrypto';

class ARIA {
    public static async encrypt(
        content: string,
        encryption: Encryption,
    ): Promise<ARIAEncryption> {
        if (!encryption.key) throw Error('Encryption key is not provided');
        encryption.cipher = encryption.cipher || Cipher.ARIA_256_GCM;

        const keyBuffer = Buffer.from(encryption.key, encryption.encoding);

        const encrypted = NativeCrypto.encrypt(
            keyBuffer,
            content,
            encryption.cipher,
        );

        return {
            algo: CryptoAlgorithm.ARIA,
            encoding: encryption.encoding,
            cipher: encryption.cipher as ARIAEncryptionWithMac['cipher'],
            ciphertext: encrypted.ciphertext,
            iv: encrypted.iv!,
            mac: encrypted.mac!,
        };
    }

    /**
     * Encrypts data stream
     * @param inputStream - path to file that will be encrypted
     * @param outputStream - place where it will be saved
     * @param algorithm - file encryption algorithm
     * @param key – key that will be used to encrypt data
     * @return {Promise<Encryption>} - encryption info
     */
    public static async encryptStream(
        inputStream: ReadStream,
        outputStream: WriteStream,
        encryption: Encryption,
    ): Promise<ARIAEncryption> {
        if (!encryption.key) throw Error('Encryption key is not provided');
        encryption.cipher = encryption.cipher || Cipher.ARIA_256_GCM;

        const keyBuffer = Buffer.from(encryption.key, encryption.encoding);

        const encrypted = await NativeCrypto.encryptStream(
            keyBuffer,
            inputStream,
            outputStream,
            encryption.cipher,
        );

        return {
            algo: CryptoAlgorithm.ARIA,
            encoding: encryption.encoding,
            cipher: encryption.cipher as ARIAEncryptionWithMac['cipher'],
            iv: encrypted.iv!,
            mac: encrypted.mac!,
        };
    }

    public static async decrypt(encryption: ARIAEncryption): Promise<string> {
        if (!encryption.key) throw Error('Decryption key is not provided');

        const key = Buffer.from(encryption.key, encryption.encoding);
        const params: any = {
            iv: Buffer.from(encryption.iv, encryption.encoding),
        };

        if ((encryption as ARIAEncryptionWithMac).mac) {
            params.mac = Buffer.from((encryption as ARIAEncryptionWithMac).mac, encryption.encoding);
        }

        return await NativeCrypto.decrypt(
            key,
            encryption.ciphertext!,
            encryption.cipher,
            params,
            encryption.encoding,
        );
    }

    /**
     * Decrypts data stream
     * @param inputStream - stream with data to decrypt
     * @param outputStream - stream where the decrypted data will be written
     * @param encryption – encryption info
     */
    public static async decryptStream(
        inputStream: ReadStream,
        outputStream: WriteStream,
        encryption: ARIAEncryption,
    ): Promise<void> {
        if (!encryption.key) throw Error('Decryption key is not provided');

        const key = Buffer.from(encryption.key, encryption.encoding);
        const params: any = {
            iv: Buffer.from(encryption.iv, encryption.encoding),
        };

        if ((encryption as ARIAEncryptionWithMac).mac) {
            params.mac = Buffer.from((encryption as ARIAEncryptionWithMac).mac, encryption.encoding);
        }

        await NativeCrypto.decryptStream(
            key,
            inputStream,
            outputStream,
            encryption.cipher,
            params,
        );
    }
}

export default ARIA;
