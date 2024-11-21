import Crypto from '../crypto/index.js';
import { Encoding } from '@super-protocol/dto-js';
import { PublicKey, Signature } from '../types/index.js';
import { Signature as SigHelper } from './../tee/helpers.js';
import { ethers } from 'ethers';
import { KeyObject, createPrivateKey, createPublicKey } from 'crypto';

type SignedData = {
  signedTime: number; // timestamp in sec
  signature: Signature;
};

export class CryptoKeysTransformer {
  private static padTo32Bytes(bytes: string): Uint8Array {
    const array = ethers.utils.arrayify('0x' + bytes);
    if (array.length === 32) {
      return array;
    }
    const padded = new Uint8Array(32);
    padded.set(array, 32 - array.length);

    return padded;
  }

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
    const rBytes32 = this.padTo32Bytes(r);
    const sBytes32 = this.padTo32Bytes(s);

    return {
      r: rBytes32,
      s: sBytes32,
      der: derSignature,
      v: 27,
    };
  }

  static appendNumberToBuffer(val: number, data: Buffer): Buffer {
    const signedTimeBuffer = Buffer.alloc(4);
    signedTimeBuffer.writeUInt32BE(val, 0);

    return Buffer.concat([data, signedTimeBuffer]);
  }

  static appendBigIntToBuffer(val: bigint, data: Buffer): Buffer {
    const hexedOrderId = ethers.utils.hexZeroPad(ethers.utils.hexlify(val), 32).slice(2);
    return Buffer.concat([data, Buffer.from(hexedOrderId, Encoding.hex)]);
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
    const hexToBase64Url = (data: Uint8Array): string => {
      const hex = Buffer.from(data).toString(Encoding.hex);
      const buffer = Buffer.from(hex.replace(/^0x/, ''), 'hex');

      return buffer.toString('base64url');
    };
    const jwk = {
      crv: key.crv,
      kty: key.kty,
      x: hexToBase64Url(key.pointX),
      y: hexToBase64Url(key.pointY),
    };

    return createPublicKey({
      key: jwk,
      format: 'jwk',
    });
  }

  static preparePublicKeyToSign(publicKey: Buffer | KeyObject): Buffer {
    const toKeyObj = (publicKey: Buffer | KeyObject): KeyObject => {
      if (publicKey instanceof Buffer) {
        return CryptoKeysTransformer.publicDerToKeyObj(publicKey);
      }

      return publicKey;
    };

    const keyObj = toKeyObj(publicKey);
    const structuredPublicKey = CryptoKeysTransformer.getStructuredPublicKeyFromKeyObj(keyObj);

    return CryptoKeysTransformer.getBufferFromTransformedPublicKey(structuredPublicKey);
  }

  static keyObjToEcdhPrivateKey(key: KeyObject): Buffer {
    const jwk = key.export({ format: 'jwk' });
    return Buffer.from(jwk.d!, Encoding.base64);
  }

  static ecdhPublicKeyToKeyObj(key: Buffer): KeyObject {
    const xBuffer = key.subarray(1, 33); // X coordinate (skip the first byte, which is the 0x04 prefix)
    const yBuffer = key.subarray(33); // Y coordinate

    const jwk = {
      kty: 'EC',
      crv: 'secp256k1',
      x: xBuffer.toString(Encoding.base64),
      y: yBuffer.toString(Encoding.base64),
    };

    return createPublicKey({ key: jwk, format: 'jwk' });
  }

  static ecdhPrivateKeyToKeyObj(key: Buffer, publicKey: Buffer): KeyObject {
    const dBuffer = key;

    const xBuffer = publicKey.subarray(1, 33);
    const yBuffer = publicKey.subarray(33);

    const jwk = {
      kty: 'EC',
      crv: 'secp256k1',
      x: xBuffer.toString('base64'),
      y: yBuffer.toString('base64'),
      d: dBuffer.toString('base64'),
    };

    return createPrivateKey({ key: jwk, format: 'jwk' });
  }

  static keyObjToEcdhPublicKey(keyObj: KeyObject): Buffer {
    const jwk = keyObj.export({ format: 'jwk' });

    const xBuffer = Buffer.from(jwk.x!, 'base64');
    const yBuffer = Buffer.from(jwk.y!, 'base64');

    return Buffer.concat([Buffer.from([0x04]), xBuffer, yBuffer]);
  }
}
