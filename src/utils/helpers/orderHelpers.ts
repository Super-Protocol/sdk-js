import {
  CryptoAlgorithm,
  Encoding,
  Encryption,
  EncryptionKey,
  HashAlgorithm,
} from '@super-protocol/dto-js';
import { createECDH } from 'crypto';
import TIIGenerator from '../../TIIGenerator.js';
import Crypto from '../../crypto/index.js';
import { OrderEncryptedInfo } from '../../types/index.js';

export async function getDerivedPrivateKey(
  publicKeyEncryption: EncryptionKey,
): Promise<EncryptionKey> {
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

export async function getEncryptionKeysForOrder(params: {
  offerId: string;
  encryptionPrivateKey: EncryptionKey;
  pccsServiceApiUrl: string;
  hashes?: string[];
  linkage?: string;
}): Promise<{ publicKey: string; encryptedInfo: string }> {
  const resultEncryption = Crypto.getPublicKey(params.encryptionPrivateKey);

  const derivedPrivateKey = await getDerivedPrivateKey(resultEncryption);

  const ecdh = createECDH('secp256k1');
  ecdh.setPrivateKey(Buffer.from(derivedPrivateKey.key!, derivedPrivateKey.encoding));
  const publicKey = {
    key: ecdh.getPublicKey(derivedPrivateKey.encoding),
    encoding: Encoding.base64,
    algo: CryptoAlgorithm.ECIES,
  } as Encryption;

  const orderInfoToEncrypt: OrderEncryptedInfo = {
    publicKey: resultEncryption,
    hashes: params.hashes || [],
    linkage: params.linkage || '',
  };

  const encryptedInfo = await TIIGenerator.encryptByTeeBlock(
    params.offerId,
    JSON.stringify(orderInfoToEncrypt),
    params.pccsServiceApiUrl,
  );

  return {
    publicKey: JSON.stringify(publicKey),
    encryptedInfo: JSON.stringify(encryptedInfo),
  };
}
