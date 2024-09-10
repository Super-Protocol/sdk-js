import {
  EncryptionKey,
  Hash,
  Encoding,
  CryptoAlgorithm,
  Encryption,
  HashAlgorithm,
} from '@super-protocol/dto-js';
import { createECDH } from 'crypto';
import { OrderEncryptedInfo, OrderResultInfo } from './types/index.js';
import Crypto from './crypto/index.js';
import TeeInputGeneratorBase from './TeeInputGeneratorBase.js';

class RIGenerator extends TeeInputGeneratorBase {
  static async getDerivedPrivateKey(publicKeyEncryption: EncryptionKey): Promise<EncryptionKey> {
    const derivedPrivateKey = await Crypto.createHash(
      Buffer.from(publicKeyEncryption.key!, publicKeyEncryption.encoding),
      { encoding: Encoding.base64, algo: HashAlgorithm.SHA256 },
    );

    return {
      key: derivedPrivateKey.hash,
      encoding: derivedPrivateKey.encoding,
      algo: CryptoAlgorithm.ECIES,
    };
  }

  static async generate(params: {
    offerId: string;
    encryptionPrivateKey: EncryptionKey;
    pccsServiceApiUrl: string;
    solutionHashes: Hash[];
    dataHashes: Hash[];
    imageHashes: Hash[];
    linkage?: string;
  }): Promise<OrderResultInfo> {
    const resultEncryption = Crypto.getPublicKey(params.encryptionPrivateKey);

    const derivedPrivateKey = await this.getDerivedPrivateKey(resultEncryption);

    const ecdh = createECDH('secp256k1');
    ecdh.setPrivateKey(Buffer.from(derivedPrivateKey.key!, derivedPrivateKey.encoding));
    const publicKey = {
      key: ecdh.getPublicKey(derivedPrivateKey.encoding),
      encoding: Encoding.base64,
      algo: CryptoAlgorithm.ECIES,
    } as Encryption;

    const orderInfoToEncrypt: OrderEncryptedInfo = {
      publicKey: resultEncryption,
      solutionHashes: params.solutionHashes || [],
      dataHashes: params.dataHashes || [],
      imageHashes: params.imageHashes || [],
      linkage: params.linkage ?? '',
    };

    const encryptedInfo = await this.encryptByTeeBlock(
      params.offerId,
      JSON.stringify(orderInfoToEncrypt),
      params.pccsServiceApiUrl,
    );

    return {
      publicKey: JSON.stringify(publicKey),
      encryptedInfo: JSON.stringify(encryptedInfo),
    };
  }

  static async getResultInfo(
    encryptedResultInfo: Encryption,
    privateKey: Buffer,
  ): Promise<OrderEncryptedInfo> {
    const resultInfo: OrderEncryptedInfo = await Crypto.decrypt({
      ...encryptedResultInfo,
      key: privateKey.toString(encryptedResultInfo.encoding),
    }).then((res) => JSON.parse(res));

    return resultInfo;
  }
}

export default RIGenerator;
