import { CryptoAlgorithm, AESEncryption, Encoding } from "@super-protocol/sp-dto-js";
import { createCipheriv, createDecipheriv, CipherGCMTypes, randomBytes } from "crypto";

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

    public static async decrypt(encryption: AESEncryption): Promise<string> {
        const key = Buffer.from(encryption.key, encryption.encoding);
        const iv = Buffer.from(encryption.iv, encryption.encoding);
        const mac = Buffer.from(encryption.mac, encryption.encoding);
        const decipher = createDecipheriv(encryption.cipher as CipherGCMTypes, key, iv);

        decipher.setAuthTag(mac);
        let decrypted = decipher.update(encryption.ciphertext!, encryption.encoding, "binary");
        decrypted += decipher.final("binary");

        return decrypted;
    }
}

export default AES;
