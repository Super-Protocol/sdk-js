import { CryptoAlgorithm, ECIESEncryption, Encryption } from "@super-protocol/dto-js";
import crypto from "crypto";

class ECIES {
    public static async encrypt(content: string, encryption: Encryption): Promise<ECIESEncryption> {
        if (!encryption.key) throw Error("Encryption key is not provided");

        const ecdh = crypto.createECDH("secp256k1");

        ecdh.generateKeys("binary", "uncompressed");
        const epk = ecdh.getPublicKey();

        const pk = ecdh.computeSecret(Buffer.from(encryption.key, encryption.encoding));

        const hash = crypto.createHash("sha512").update(pk).digest();

        const cipherKey = hash.slice(0, 32),
            macKey = hash.slice(32);
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipheriv("aes-256-cbc", cipherKey, iv);
        let ct = cipher.update(content);
        ct = Buffer.concat([ct, cipher.final()]);
        const dataToMac = Buffer.concat([iv, epk, ct]);
        const mac = crypto.createHmac("sha256", macKey).update(dataToMac).digest();

        return {
            iv: iv.toString(encryption.encoding),
            ephemPublicKey: epk.toString(encryption.encoding),
            mac: mac.toString(encryption.encoding),
            encoding: encryption.encoding,
            algo: CryptoAlgorithm.ECIES,
            ciphertext: ct.toString(encryption.encoding),
        };
    }

    public static async decrypt(encryption: ECIESEncryption): Promise<string> {
        if (!encryption.key) throw Error("Decryption key is not provided");

        const iv = Buffer.from(encryption.iv, encryption.encoding),
            epk = Buffer.from(encryption.ephemPublicKey, encryption.encoding),
            ct = Buffer.from(encryption.ciphertext!, encryption.encoding),
            mac = Buffer.from(encryption.mac, encryption.encoding);

        const ecdh = crypto.createECDH("secp256k1");
        ecdh.setPrivateKey(Buffer.from(encryption.key, encryption.encoding));

        const pk = ecdh.computeSecret(epk);

        const hash = crypto.createHash("sha512").update(pk).digest();

        const cipherKey = hash.slice(0, 32),
            macKey = hash.slice(32);
        const m = crypto
            .createHmac("sha256", macKey)
            .update(Buffer.concat([iv, epk, ct]))
            .digest();
        if (m.compare(mac) !== 0 || mac.compare(m) !== 0) {
            throw new Error("Corrupted Ecies body: unmatched authentication code");
        }
        const decipher = crypto.createDecipheriv("aes-256-cbc", cipherKey, iv);
        const pt = decipher.update(ct);

        const result = Buffer.concat([pt, decipher.final()]);

        return result.toString("binary");
    }
}

export default ECIES;
