import eccrypto from "eccrypto";
// @ts-ignore hybrid-crypto-js doesn't have types
import {Crypt} from 'hybrid-crypto-js';

class Crypto {
    /**
     * Used to encrypt data before sending it to blockchain
     * @param algorithm - encryption algorithm
     * @param data - string data to encrypt
     * @param publicKey - key in string format (pem key for RSA-Hybrid, 65-byte hex key for ECIES)
     * @return Promise<string> - encrypted string
     */
    static async encrypt(algorithm: CryptoAlgorithm, data: string, publicKey: string): Promise<string> {
        switch (algorithm) {
            case "RSA-Hybrid":
                const crypt = new Crypt({
                    aesStandard: 'AES-GCM',
                    rsaStandard: 'RSA-OAEP',
                });

                return crypt.encrypt(publicKey, data);

            case "ECIES":
                const result = await eccrypto.encrypt(Buffer.from(publicKey, "hex"), Buffer.from(data));
                return JSON.stringify({
                    iv: result.iv.toString("base64"),
                    ephemPublicKey: result.ephemPublicKey.toString("base64"),
                    ciphertext: result.ciphertext.toString("base64"),
                    mac: result.mac.toString("base64"),
                });

            default:
                throw new Error(algorithm + " encryption algorithm is not supported");
        }
    }

    /**
     * Used to decrypt data from blockchain
     * @param algorithm - decryption algorithm
     * @param data - string data to encrypt
     * @param privateKey - key in string format (pem key for RSA-Hybrid, 32-byte hex key for ECIES)
     * @return Promise<string> - decrypted string
     */
    static async decrypt(algorithm: CryptoAlgorithm, data: string, privateKey: string): Promise<string> {
        switch (algorithm) {
            case "RSA-Hybrid":
                const crypt = new Crypt({
                    aesStandard: 'AES-GCM',
                    rsaStandard: 'RSA-OAEP',
                });

                try {
                    return crypt.decrypt(privateKey, data).message;
                } catch (errorMessage) {
                    // @ts-ignore hybrid-crypto-js library throws just error message (not error object)
                    throw new Error(errorMessage);
                }

            case "ECIES":
                const encryptedJSON = JSON.parse(data);
                const encryptedObject = {
                    iv: Buffer.from(encryptedJSON.iv, "base64"),
                    ephemPublicKey: Buffer.from(encryptedJSON.ephemPublicKey, "base64"),
                    ciphertext: Buffer.from(encryptedJSON.ciphertext, "base64"),
                    mac: Buffer.from(encryptedJSON.mac, "base64"),
                };

                const result = await eccrypto.decrypt(Buffer.from(privateKey, "hex"), encryptedObject);
                return result.toString();

            default:
                throw new Error(algorithm + " decryption algorithm is not supported");
        }
    }
}

export type CryptoAlgorithm = "RSA-Hybrid" | "ECIES";

export default Crypto;
