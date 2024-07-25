import { CryptoAlgorithm, Encoding, Encryption } from '@super-protocol/dto-js';
import { Crypto, CryptoKeysTransformer } from '../../src/index.js';
import { OrderArgsHelper } from '../../src/utils/helpers/OrderArgsHelper.js';

describe('OrderArgsHelper', () => {
  const args = { firstArgument: 1, secondArgument: 'second' };

  test('should encrypt and decrypt arguments', async () => {
    const keys = await Crypto.generateKeys(CryptoAlgorithm.ECIES);

    const publicEncryption: Encryption = {
      algo: CryptoAlgorithm.ECIES,
      encoding: Encoding.base64,
      key: CryptoKeysTransformer.keyObjToEcdhPublicKey(keys.publicKey).toString(Encoding.base64),
    };

    const encryptedArgs = await OrderArgsHelper.encryptOrderArgs(args, publicEncryption);

    expect(typeof encryptedArgs).toBe('string');
    expect(encryptedArgs).not.toHaveLength(0);

    const privateKey = CryptoKeysTransformer.keyObjToEcdhPrivateKey(keys.privateKey).toString(
      Encoding.base64,
    );
    const decryptedArgs = await OrderArgsHelper.decryptOrderArgs(encryptedArgs, privateKey);

    expect(decryptedArgs).toEqual(args);
  });
});
