import { ReadStream, WriteStream } from 'fs';
import {
    Cipher,
    CryptoAlgorithm,
    Encryption,
    EncryptionWithMacIV,
    RSAHybridEncryption,
} from '@super-protocol/dto-js';
import {
    createPublicKey,
    createPrivateKey,
    createHash,
    constants as CryptoConstants,
    JsonWebKey,
    KeyObject,
    publicEncrypt,
    privateDecrypt,
    randomBytes,
} from 'crypto';
import NativeCrypto from './NativeCrypto';

type KeysType = Record<string, string>;

class RSAHybrid {
    public static getKeyFingerprint(key: KeyObject): string {
        const jsonKey: JsonWebKey = key.export({ format: 'jwk' });
        const buffer = Buffer.concat([
            Buffer.from('ssh-rsa'),
            Buffer.from(jsonKey.e || ''),
            Buffer.from(jsonKey.n || ''),
        ]);
        const hex = createHash('md5').update(buffer).digest('hex');

        return hex.match(/.{2}/g)!.join(':');
    }

    private static publicEncrypt(rsaKey: string, aesKey: Buffer): KeysType {
        const publicKey = createPublicKey({
            key: rsaKey,
            format: 'pem',
        });
        const encryptedKey = publicEncrypt(
            {
                key: publicKey,
                padding: CryptoConstants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            Buffer.from(aesKey),
        );
        const keyFingerprint = this.getKeyFingerprint(publicKey);

        return {
            [keyFingerprint]: encryptedKey.toString('base64'),
        };
    }

    private static privateDecrypt(rsaKey: string, keys: KeysType): Buffer {
        const privateKey = createPrivateKey({
            key: rsaKey,
            format: 'pem',
        });

        const keyFingerprint = this.getKeyFingerprint(privateKey);

        const encryptedKey = keys[keyFingerprint];
        const aesKey = privateDecrypt(
            {
                key: privateKey,
                padding: CryptoConstants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            Buffer.from(encryptedKey, 'base64'),
        );

        return aesKey;
    }

    public static encrypt(content: string, encryption: Encryption): RSAHybridEncryption {
        const aesKey: Buffer = randomBytes(32);
        const keys: KeysType = this.publicEncrypt(encryption.key as string, aesKey);

        const encrypted = NativeCrypto.encrypt(
            aesKey,
            content,
            Cipher.AES_256_GCM,
            encryption.encoding,
        ) as EncryptionWithMacIV;

        return {
            ...encrypted,
            encoding: encryption.encoding,
            algo: CryptoAlgorithm.RSAHybrid,
            cipher: Cipher.RSA_OAEP_AES_GCM,
            keys: JSON.stringify(keys),
        };
    }

    public static async encryptStream(
        inputStream: ReadStream,
        outputStream: WriteStream,
        encryption: Encryption,
    ): Promise<RSAHybridEncryption> {
        const aesKey: Buffer = randomBytes(32);
        const keys: KeysType = this.publicEncrypt(encryption.key as string, aesKey);

        const encrypted = (await NativeCrypto.encryptStream(
            aesKey,
            inputStream,
            outputStream,
            Cipher.AES_256_GCM,
            encryption.encoding,
        )) as EncryptionWithMacIV;

        return {
            ...encrypted,
            encoding: encryption.encoding,
            algo: CryptoAlgorithm.RSAHybrid,
            cipher: Cipher.RSA_OAEP_AES_GCM,
            keys: JSON.stringify(keys),
        };
    }

    public static decrypt(encryption: RSAHybridEncryption): string {
        const iv: Buffer = Buffer.from(encryption.iv, encryption.encoding);
        const mac: Buffer = Buffer.from(encryption.mac, encryption.encoding);
        const aesKey: Buffer = this.privateDecrypt(
            encryption.key as string,
            JSON.parse(encryption.keys),
        );

        const decrypted: string = NativeCrypto.decrypt(
            aesKey,
            encryption.ciphertext as string,
            Cipher.AES_256_GCM,
            {
                iv,
                mac,
            },
            encryption.encoding,
        );

        return decrypted;
    }

    public static async decryptStream(
        inputStream: ReadStream,
        outputStream: WriteStream,
        encryption: RSAHybridEncryption,
    ): Promise<void> {
        const iv: Buffer = Buffer.from(encryption.iv, encryption.encoding);
        const mac: Buffer = Buffer.from(encryption.mac, encryption.encoding);
        const aesKey: Buffer = this.privateDecrypt(
            encryption.key as string,
            JSON.parse(encryption.keys),
        );

        await NativeCrypto.decryptStream(aesKey, inputStream, outputStream, Cipher.AES_256_GCM, {
            iv,
            mac,
        });
    }
}

export default RSAHybrid;
