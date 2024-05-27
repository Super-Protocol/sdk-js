import Crypto from '../crypto/index.js';
import { Encoding } from '@super-protocol/dto-js';
import { PublicKey, Signature } from './../types/index.js';
import { Signature as SigHelper } from './../tee/helpers.js';
import { ethers } from 'ethers';
import { KeyObject, createPrivateKey, createPublicKey } from 'crypto';

type SignedData = {
  signedTime: number; // timestamp in sec
  signature: Signature;
};

export class CryptoKeysTransformer {
  static getStructuredPrivateKeyFromKeyObj(privateKeyObj: KeyObject): string {
    const privateKeyJwk = privateKeyObj.export({ format: 'jwk' });
    return Buffer.from(privateKeyJwk.d!, 'base64url').toString('hex');
  }

  static getStructuredPublicKeyFromKeyObj(publicKeyObj: KeyObject): PublicKey {
    const publicKeyJwk = publicKeyObj.export({ format: 'jwk' });
    return {
      kty: publicKeyJwk.kty!,
      crv: publicKeyJwk.crv!,
      pointX: ethers.utils.arrayify(
        '0x' + Buffer.from(publicKeyJwk.x!, 'base64url').toString('hex'),
      ),
      pointY: ethers.utils.arrayify(
        '0x' + Buffer.from(publicKeyJwk.y!, 'base64url').toString('hex'),
      ),
    };
  }

  static getBufferFromTransformedPublicKey(publicKey: PublicKey): Buffer {
    const { crv, kty, pointX, pointY } = publicKey;
    return Buffer.concat([
      Buffer.from(crv),
      Buffer.from(kty),
      Buffer.from(pointX),
      Buffer.from(pointY),
    ]);
  }

  static parseDerSignature(derSignature: string): Signature {
    const { r, s } = SigHelper.importFromDER(derSignature);

    return {
      r: ethers.utils.arrayify('0x' + r),
      s: ethers.utils.arrayify('0x' + s),
      der: derSignature,
      v: 27,
    };
  }

  static appendNumberToBuffer(val: number, data: Buffer): Buffer {
    const signedTimeBuffer = Buffer.alloc(4);
    signedTimeBuffer.writeUInt32BE(val, 0);

    return Buffer.concat([data, signedTimeBuffer]);
  }

  static sign(privateKey: KeyObject, data: Buffer): SignedData {
    const signedTime = Math.floor(Date.now() / 1000);

    const signatureOrigin = Crypto.sign({
      data: CryptoKeysTransformer.appendNumberToBuffer(signedTime, data),
      privateKey,
      outputFormat: Encoding.hex,
    });
    const signature = CryptoKeysTransformer.parseDerSignature(signatureOrigin);

    return {
      signedTime,
      signature,
    };
  }

  static verify(
    publicKey: KeyObject,
    data: Buffer,
    signature: string,
    signedTime: number,
  ): boolean {
    return Crypto.verify({
      data: CryptoKeysTransformer.appendNumberToBuffer(signedTime, data),
      publicKey,
      signature,
      signatureFormat: Encoding.hex,
    });
  }

  static privateKeyObjToDer(key: KeyObject): Buffer {
    return key.export({ type: 'pkcs8', format: 'der' });
  }

  static publicKeyObjToDer(key: KeyObject): Buffer {
    return key.export({ type: 'spki', format: 'der' });
  }

  static keyObjectsToDer({
    privateKey,
    publicKey,
  }: {
    privateKey: KeyObject;
    publicKey: KeyObject;
  }): { privateKey: Buffer; publicKey: Buffer } {
    return {
      privateKey: CryptoKeysTransformer.privateKeyObjToDer(privateKey),
      publicKey: CryptoKeysTransformer.publicKeyObjToDer(publicKey),
    };
  }

  static privateDerToKeyObj(key: Buffer): KeyObject {
    return createPrivateKey({
      key,
      type: 'pkcs8',
      format: 'der',
    });
  }

  static publicDerToKeyObj(key: Buffer): KeyObject {
    return createPublicKey({
      key,
      type: 'spki',
      format: 'der',
    });
  }

  static getKeyObjFromStructuredPublicKey(key: PublicKey): KeyObject {
    const replace = (data: string): string => data.replace(/=/g, '');
    const transform = (data: Uint8Array): string =>
      replace(Buffer.from(data).toString(Encoding.base64));
    const jwk = {
      crv: key.crv,
      kty: key.kty,
      x: transform(key.pointX),
      y: transform(key.pointY),
    };

    return createPublicKey({
      key: jwk,
      format: 'jwk',
    });
  }
}
