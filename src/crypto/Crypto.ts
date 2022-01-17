import {
    AESEncryption,
    CryptoAlgorithm,
    ECIESEncryption,
    Encoding,
    Encryption,
    RSAHybridEncryption,
} from "@super-protocol/sp-dto-js";
import AES from "./nodejs/AES";
import ECIES from "./nodejs/ECIES";
import RSAHybrid from "./universal/RSA-Hybrid";

class Crypto {
    /**
     * Used to encrypt data before sending it to blockchain
     * @param algorithm - encryption algorithm
     * @param content - string data to encrypt
     * @param key - key in string format (default encoding base64)
     * @param encoding - encoding of key and output data
     * @return Promise<Encryption> - object what contains encrypted data, key and spec to decryption
     */
    static async encrypt(
        algorithm: CryptoAlgorithm,
        content: string,
        key: string,
        encoding: Encoding = Encoding.base64
    ): Promise<Encryption> {
        switch (algorithm) {
            case CryptoAlgorithm.AES:
                return await AES.encrypt(key, content, encoding);

            case CryptoAlgorithm.ECIES:
                return await ECIES.encrypt(key, content, encoding);

            case CryptoAlgorithm.RSAHybrid:
                return await RSAHybrid.encrypt(key, content, encoding);

            default:
                throw Error(`${algorithm} algorithm not supported`);
        }
    }

    /**
     * Used to decrypt data from blockchain
     * @param encryption - object what contains encrypted data, key and spec to decryption
     * @return Promise<string> - decrypted string
     */
    static async decrypt(encryption: Encryption): Promise<string> {
        switch (encryption.algo) {
            case CryptoAlgorithm.AES:
                return await AES.decrypt(encryption as AESEncryption);

            case CryptoAlgorithm.ECIES:
                return await ECIES.decrypt(encryption as ECIESEncryption);

            case CryptoAlgorithm.RSAHybrid:
                return await RSAHybrid.decrypt(encryption as RSAHybridEncryption);

            default:
                throw Error(`${encryption.algo} algorithm not supported`);
        }
    }
}

export default Crypto;
