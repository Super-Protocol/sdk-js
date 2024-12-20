import {
  AESEncryption,
  ARIAEncryption,
  CryptoAlgorithm,
  ECIESEncryption,
  Encryption,
  Hash,
  RSAHybridEncryption,
  EncryptionKey,
} from '@super-protocol/dto-js';
import fs from 'fs';
import AES from './nodejs/AES.js';
import ARIA from './nodejs/ARIA.js';
import ECIES from './nodejs/ECIES.js';
import RSAHybrid from './nodejs/RSA-Hybrid.js';
import NativeCrypto from './nodejs/NativeCrypto.js';
import { Readable } from 'stream';
import crypto, { BinaryToTextEncoding, KeyObject } from 'crypto';
import { HashAlgorithm } from '@super-protocol/dto-js';
import { CryptoKeyType } from './types.js';

class Crypto {
  /**
   * Used to encrypt data before sending it to blockchain
   * @param algorithm - encryption algorithm
   * @param content - string data to encrypt
   * @param key - key in string format (default encoding base64)
   * @param encoding - encoding of key and output data
   * @returns {Promise<Encryption>} - object what contains encrypted data, key and spec to decryption
   */
  static async encrypt(content: string, encryption: Encryption): Promise<Encryption> {
    switch (encryption.algo) {
      case CryptoAlgorithm.AES:
        return await AES.encrypt(content, encryption);

      case CryptoAlgorithm.ARIA:
        return await ARIA.encrypt(content, encryption);

      case CryptoAlgorithm.ECIES:
        return await ECIES.encrypt(content, encryption);

      case CryptoAlgorithm.RSAHybrid:
        return await RSAHybrid.encrypt(content, encryption);

      default:
        throw Error(`${encryption.algo} algorithm not supported`);
    }
  }

  /**
   * Encrypts data stream
   * @param inputStream - path to file that will be encrypted
   * @param outputStream - place where it will be saved
   * @param algorithm - file encryption algorithm
   * @param key – key that will be used to encrypt data
   * @returns {Promise<Encryption>} - encryption info
   */
  static async encryptStream(
    inputStream: fs.ReadStream,
    outputStream: fs.WriteStream,
    encryption: Encryption,
  ): Promise<Encryption> {
    switch (encryption.algo) {
      case CryptoAlgorithm.AES:
        return await AES.encryptStream(inputStream, outputStream, encryption);
      case CryptoAlgorithm.ARIA:
        return await ARIA.encryptStream(inputStream, outputStream, encryption);
      case CryptoAlgorithm.RSAHybrid:
        return await RSAHybrid.encryptStream(inputStream, outputStream, encryption);
      default:
        throw Error(`${encryption.algo} algorithm not supported`);
    }
  }

  /**
   * Used to decrypt data from blockchain
   * @param encryption - object what contains encrypted data, key and spec to decryption
   * @returns {Promise<string>} - decrypted string
   */
  static async decrypt(encryption: Encryption): Promise<string> {
    switch (encryption.algo) {
      case CryptoAlgorithm.AES:
        return AES.decrypt(encryption as AESEncryption);

      case CryptoAlgorithm.ARIA:
        return ARIA.decrypt(encryption as ARIAEncryption);

      case CryptoAlgorithm.ECIES:
        return ECIES.decrypt(encryption as ECIESEncryption);

      case CryptoAlgorithm.RSAHybrid:
        return RSAHybrid.decrypt(encryption as RSAHybridEncryption);

      default:
        throw Error(`${encryption.algo} algorithm not supported`);
    }
  }

  /**
   * Decrypts data stream
   * @param inputStream - stream with data to decrypt
   * @param outputStream - stream where the decrypted data will be written
   * @param encryption – encryption info
   */
  static async decryptStream(
    inputStream: fs.ReadStream,
    outputStream: fs.WriteStream,
    encryption: Encryption,
  ): Promise<void> {
    switch (encryption.algo) {
      case CryptoAlgorithm.AES:
        return await AES.decryptStream(inputStream, outputStream, encryption as AESEncryption);
      case CryptoAlgorithm.ARIA:
        return await ARIA.decryptStream(inputStream, outputStream, encryption as ARIAEncryption);
      case CryptoAlgorithm.RSAHybrid:
        return await RSAHybrid.decryptStream(
          inputStream,
          outputStream,
          encryption as RSAHybridEncryption,
        );
      default:
        throw Error(`${encryption.algo} algorithm not supported`);
    }
  }

  /**
   * Create hash from content
   * @param content - buffer data to create hash from
   * @param hashInfo - information about hash algorithm and encoding
   * @returns Hash structure with hash itself hash algorithm and encoding
   */
  static async createHash(content: Buffer, hashInfo: Omit<Hash, 'hash'>): Promise<Hash>;
  /**
   * Create hash from stream
   * @param inputStream - readable stream
   * @param hashInfo - information about hash algorithm and encoding
   * @returns Hash structure with hash itself hash algorithm and encoding
   */
  static async createHash(inputStream: Readable, hashInfo: Omit<Hash, 'hash'>): Promise<Hash>;
  static async createHash(param1: Buffer | Readable, hashInfo: Omit<Hash, 'hash'>): Promise<Hash> {
    const { algo, encoding } = hashInfo;
    return Buffer.isBuffer(param1)
      ? NativeCrypto.createHashFromBuffer(param1, algo, encoding)
      : await NativeCrypto.createHashFromStream(param1, algo, encoding);
  }

  static getPublicKey(privateKey: EncryptionKey): EncryptionKey {
    switch (privateKey.algo) {
      case CryptoAlgorithm.ECIES:
        return ECIES.getPublicKeyEncryption(privateKey);
      default:
        throw Error(`${privateKey.algo} algorithm not supported`);
    }
  }

  static async generateKeys<T extends CryptoAlgorithm>(algo: T): Promise<CryptoKeyType<T>> {
    switch (algo) {
      case CryptoAlgorithm.ECIES:
        return (await ECIES.generateKeys()) as CryptoKeyType<T>;
      case CryptoAlgorithm.AES:
        return AES.generateKeys() as CryptoKeyType<T>;
      default:
        throw Error(`${algo} algorithm not supported`);
    }
  }

  static sign(params: {
    data: Buffer | string;
    privateKey: KeyObject;
    outputFormat?: BinaryToTextEncoding;
    algo?: HashAlgorithm;
  }): string {
    const { data, outputFormat = 'base64', algo = HashAlgorithm.SHA256 } = params;

    if (!params.privateKey) {
      throw new Error('sign failed, private key is not assigned');
    }

    const signer = crypto.createSign(algo);
    signer.write(data);
    signer.end();

    return signer.sign(params.privateKey, outputFormat);
  }

  static verify(params: {
    data: Buffer | string;
    publicKey: KeyObject;
    signatureFormat?: BinaryToTextEncoding;
    algo?: HashAlgorithm;
    signature: string;
  }): boolean {
    const { data, signature, signatureFormat = 'base64', algo = HashAlgorithm.SHA256 } = params;

    if (!params.publicKey) {
      throw new Error('verify failed, public key is not assigned');
    }

    const verifier = crypto.createVerify(algo);
    verifier.write(data);
    verifier.end();

    return verifier.verify(params.publicKey, signature, signatureFormat);
  }
}

export default Crypto;
