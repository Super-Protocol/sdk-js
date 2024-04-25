import { getCiphers, randomBytes } from 'crypto';

import NativeCrypto from '../../src/crypto/nodejs/NativeCrypto.js';
import { Encoding } from '@super-protocol/dto-js';

const inputEncoding = 'binary';
const outputEncoding = Encoding.base64;
const content: string = randomBytes(16).toString(inputEncoding);
const isECB = (cipher: string): boolean =>
  /ecb/i.test(cipher) || cipher === 'des-ede' || cipher === 'des-ede3';
const isRC4 = (cipher: string): boolean => /^rc4/i.test(cipher);

describe('NativeCrypto', () => {
  for (const cipher of getCiphers()) {
    if (/wrap/.test(cipher)) {
      continue;
    }

    if (isECB(cipher) || isRC4(cipher)) {
      describe(cipher, () => {
        it(`should throw an error`, () => {
          const key: Buffer = NativeCrypto.createKey(cipher);
          expect(() =>
            NativeCrypto.encrypt(key, content, cipher, outputEncoding, inputEncoding),
          ).toThrowError(`Cipher "${cipher}" is not supported`);
        });
      });
      continue;
    }

    const key: Buffer = NativeCrypto.createKey(cipher);
    describe(cipher, () => {
      it('encrypt/decrypt string', async () => {
        const encrypted = NativeCrypto.encrypt(key, content, cipher, outputEncoding, inputEncoding);

        const params: any = {};
        if (encrypted.iv) {
          params.iv = Buffer.from(encrypted.iv!, outputEncoding);
        }
        if (encrypted.mac) {
          params.mac = Buffer.from(encrypted.mac!, outputEncoding);
        }

        let decrypted: string;
        decrypted = await NativeCrypto.decrypt(
          key,
          encrypted.ciphertext!,
          cipher,
          params,
          outputEncoding,
          inputEncoding,
        );

        expect(decrypted).toEqual(content);
      });
    });
  }
});
