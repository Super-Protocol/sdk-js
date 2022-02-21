import {Cipher, CryptoAlgorithm, Encryption, RSAHybridEncryption} from "@super-protocol/sp-dto-js";
// @ts-ignore hybrid-crypto-js doesn't have types
import { Crypt } from "hybrid-crypto-js";

class RSAHybrid {
    public static async encrypt(
        content: string,
        encryption: Encryption
    ): Promise<RSAHybridEncryption> {
        const cipherName = {
            aesStandard: "AES-GCM",
            rsaStandard: "RSA-OAEP",
        };

        const crypt = new Crypt(cipherName);

        const encrypted = JSON.parse(crypt.encrypt(encryption.key, content));
        return {
            algo: CryptoAlgorithm.RSAHybrid,
            // FIXME: Add changing encoding (currently lib support only one encoding): SP-385
            encoding: encryption.encoding,
            cipher: JSON.stringify(cipherName) as Cipher,
            keys: JSON.stringify(encrypted.keys),
            iv: encrypted.iv,
            mac: encrypted.tag,
            ciphertext: encrypted.cipher, // Lib returns ciphertext as cipher
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
