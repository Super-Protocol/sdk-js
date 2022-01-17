import { CryptoAlgorithm, Encoding, RSAHybridEncryption } from "@super-protocol/sp-dto-js";
// @ts-ignore hybrid-crypto-js doesn't have types
import { Crypt } from "hybrid-crypto-js";

class RSAHybrid {
    public static async encrypt(
        publicKey: string,
        content: string,
        // FIXME: Add changing encoding (currently lib support only one encoding): SP-385
        encoding: Encoding = Encoding.base64
    ): Promise<RSAHybridEncryption> {
        const cipherName = {
            aesStandard: "AES-GCM",
            rsaStandard: "RSA-OAEP",
        };

        const crypt = new Crypt(cipherName);

        const encrypted = JSON.parse(crypt.encrypt(publicKey, content));
        return {
            key: publicKey,
            algo: CryptoAlgorithm.RSAHybrid,
            encoding,
            cipher: JSON.stringify(cipherName),
            keys: JSON.stringify(encrypted.keys),
            iv: encrypted.iv,
            mac: encrypted.tag,
            ciphertext: encrypted.cipher,
        };
    }

    public static async decrypt(encryption: RSAHybridEncryption): Promise<string> {
        const crypt = new Crypt(JSON.parse(encryption.cipher!));

        const encrypted = JSON.stringify({
            v: "hybrid-crypto-js_0.2.4",
            keys: JSON.parse(encryption.keys),
            iv: encryption.iv,
            tag: encryption.mac,
            cipher: encryption.ciphertext,
        });

        try {
            return crypt.decrypt(encryption.key, encrypted).message;
        } catch (errorMessage) {
            // @ts-ignore hybrid-crypto-js library throws just error message (not error object)
            throw new Error(errorMessage);
        }
    }
}

export default RSAHybrid;
