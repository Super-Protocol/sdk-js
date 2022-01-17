import { CryptoAlgorithm, ECIESEncryption, Encoding } from "@super-protocol/sp-dto-js";
import eccrypto from "eccrypto";

class ECIES {
    public static async encrypt(
        publicKey: string,
        content: string,
        encoding: Encoding = Encoding.base64
    ): Promise<ECIESEncryption> {
        const result = await eccrypto.encrypt(Buffer.from(publicKey, encoding), Buffer.from(content, "binary"));
        return {
            key: publicKey,
            iv: result.iv.toString(encoding),
            ephemPublicKey: result.ephemPublicKey.toString(encoding),
            mac: result.mac.toString(encoding),
            encoding,
            algo: CryptoAlgorithm.ECIES,
            ciphertext: result.ciphertext.toString(encoding),
        };
    }

    public static async decrypt(encryption: ECIESEncryption): Promise<string> {
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
