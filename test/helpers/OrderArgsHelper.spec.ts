import _ from 'lodash';
import { OrderArgsHelper } from '../../src/utils/helpers/index.js';
import { TeeOrderEncryptedArgs } from '@super-protocol/dto-js';

describe('OrderArgsHelper', () => {
  describe('calculateArgsHash', () => {
    const encryptedArgs = {
      data: ['data11111', 'data22222'],
      solution: ['solution222', 'solution111'],
      image: [],
      configuration: 'configuration',
    };
    const encryptedArgsHash = {
      algo: 'sha256',
      encoding: 'hex',
      hash: 'f81a0e0c2119c64041db6b2b859d5c08421facf53486a171f8d4728283500fde',
    };

    test('calculates hash', async () => {
      const hash = await OrderArgsHelper.calculateArgsHash(encryptedArgs);

      expect(hash).toEqual(encryptedArgsHash);
    });

    test('calculates hash without being dependent on the order of keys and elements in the array', async () => {
      const encryptedAgs2 = _.shuffle(Object.entries(encryptedArgs)).reduce(
        (acc: Record<string, unknown>, [key, value]) => {
          acc[key] = Array.isArray(value) ? _.shuffle(value) : value;
          return acc;
        },
        {},
      );

      const hash = await OrderArgsHelper.calculateArgsHash(
        encryptedAgs2 as unknown as TeeOrderEncryptedArgs,
      );

      expect(hash).toEqual(encryptedArgsHash);
    });
  });
});
