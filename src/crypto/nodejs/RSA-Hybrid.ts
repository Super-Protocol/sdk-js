import { Cipher, CryptoAlgorithm, Encryption, RSAHybridEncryption } from "@super-protocol/sp-dto-js";
import {
    createCipheriv,
    createDecipheriv,
    createPublicKey,
    createPrivateKey,
    createHash,
    constants as CryptoConstants,
    CipherGCM,
    DecipherGCM,
    JsonWebKey,
    publicEncrypt,
    privateDecrypt,
    randomBytes,
} from "crypto";

const getPublicKeyFingerprint = (key: JsonWebKey) => {
    const buffer = Buffer.concat([Buffer.from("ssh-rsa"), Buffer.from(key.e || ""), Buffer.from(key.n || "")]);
    const hex = createHash("md5").update(buffer).digest("hex");

    return hex.match(/.{2}/g)!.join(":");
};

class RSAHybrid {
    public static async encrypt(content: string, encryption: Encryption): Promise<RSAHybridEncryption> {
        const cipherName = {
            aesStandard: "AES-GCM",
            rsaStandard: "RSA-OAEP",
        };
        const aesKey: Buffer = randomBytes(32);
        const iv: Buffer = randomBytes(12);
        const cipher: CipherGCM = createCipheriv("aes-256-gcm", aesKey, iv);

        const publicKey = createPublicKey({
            key: encryption.key as string,
            format: "pem",
        });

        const encryptedKey = publicEncrypt(
            {
                key: publicKey,
                padding: CryptoConstants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            Buffer.from(aesKey),
        );
        const keyFingerprint = getPublicKeyFingerprint(publicKey.export({ format: "jwk" }));

        let ciphertext: string = cipher.update(content, "binary", encryption.encoding);
        ciphertext += cipher.final(encryption.encoding);

        const mac: Buffer = cipher.getAuthTag();

        return {
            algo: CryptoAlgorithm.RSAHybrid,
            cipher: JSON.stringify(cipherName) as Cipher,
            encoding: encryption.encoding,
            iv: iv.toString(encryption.encoding),
            mac: mac.toString(encryption.encoding),
            keys: JSON.stringify({
                [keyFingerprint]: encryptedKey.toString("base64"),
            }),
            ciphertext,
        };
    }

    public static async decrypt(encryption: RSAHybridEncryption): Promise<string> {
        const iv: Buffer = Buffer.from(encryption.iv, encryption.encoding);
        const mac: Buffer = Buffer.from(encryption.mac, encryption.encoding);

        const privateKey = createPrivateKey({
            key: encryption.key as string,
            format: "pem",
        });

        const keyFingerprint = getPublicKeyFingerprint(privateKey.export({ format: "jwk" }));

        const encryptedKey = JSON.parse(encryption.keys)[keyFingerprint];
        const aesKey = privateDecrypt(
            {
                key: privateKey,
                padding: CryptoConstants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            Buffer.from(encryptedKey, "base64"),
        );

        const decipher: DecipherGCM = createDecipheriv("aes-256-gcm", aesKey, iv);
        decipher.setAuthTag(mac);

        let decrypted: string = decipher.update(encryption.ciphertext!, encryption.encoding, "utf-8");
        decrypted += decipher.final("utf-8");

        return decrypted;
    }
}

export default RSAHybrid;
