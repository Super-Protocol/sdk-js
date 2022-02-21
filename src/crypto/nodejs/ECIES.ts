import {CryptoAlgorithm, ECIESEncryption, Encryption} from "@super-protocol/sp-dto-js";
import eccrypto from "eccrypto";

class ECIES {
    public static async encrypt(
        content: string,
        encryption: Encryption,
    ): Promise<ECIESEncryption> {
        if (!encryption.key) throw Error('Encryption key is not provided');

        const result = await eccrypto.encrypt(Buffer.from(encryption.key, encryption.encoding), Buffer.from(content, "binary"));
        return {
            iv: result.iv.toString(encryption.encoding),
            ephemPublicKey: result.ephemPublicKey.toString(encryption.encoding),
            mac: result.mac.toString(encryption.encoding),
            encoding: encryption.encoding,
            algo: CryptoAlgorithm.ECIES,
            ciphertext: result.ciphertext.toString(encryption.encoding),
        };
    }

    public static async decrypt(encryption: ECIESEncryption): Promise<string> {
        if (!encryption.key) throw Error('Decryption key is not provided');

        const encryptedObject = {
            iv: Buffer.from(encryption.iv, encryption.encoding),
            ephemPublicKey: Buffer.from(encryption.ephemPublicKey, encryption.encoding),
            ciphertext: Buffer.from(encryption.ciphertext!, encryption.encoding),
            mac: Buffer.from(encryption.mac, encryption.encoding),
        };

        const result = await eccrypto.decrypt(Buffer.from(encryption.key, encryption.encoding), encryptedObject);
        return result.toString("binary");
    }
}

export default ECIES;
