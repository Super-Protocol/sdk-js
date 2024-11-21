import { BlockchainId, OfferInfo, OfferType, TcbUtilityData, TeeOfferInfo } from '../src/index.js';
import TIIGenerator from '../src/TIIGenerator.js';
import {
  CryptoAlgorithm,
  Encoding,
  Resource,
  ResourceType,
  StorageProviderResource,
  StorageType,
} from '@super-protocol/dto-js';
import { ValidationResult } from '../src/tee/QuoteValidator.js';
import { QuoteValidationStatuses } from '../src/tee/statuses.js';

const fileEncryptionAlgo = CryptoAlgorithm.AES;
const key = '12345789';

const argsPrivateKey = '6W6C+mZySBfsFKjiu3uOXsFlBwd1vXDL8QJHDdGlz5s=';
const argsPrivateKeyIncorrect = 'KQ/00gBxyIpgyB73Cbxadi7TZiJKIpykrCMOU/FSRkQ=';
const argsPublicKey = JSON.stringify({
  key: 'BHlWgcWngcGxGMoy/xvri5qY0aeddEt5JMnQpsNZQSbbd1OCfPLOnLDa0J5nhofA+/78DbBdBpo2g6XeDPQGZWA=',
  algo: CryptoAlgorithm.ECIES,
  encoding: Encoding.base64,
});

const tii = JSON.stringify({
  encryptedResource: {
    iv: 'e2Cp6uVK8wCoZNKzGIMpYQ==',
    ephemPublicKey:
      'BPBoD/AafUCu5WbFMzkwqR53ygHEoYPeRcYsXGYK6nkuXMsRggmbd9B8pgo6bbaQFzbCW4kyLPyP1MPgjvbKKgo=',
    mac: 'kzRH+Qgeih2V2RTRrikWQEGPRgcHwvpsPZyqmLwbh80=',
    encoding: 'base64',
    algo: 'ECIES',
    ciphertext:
      'Z9fyGL8xkIUeR9zxw9UGvn988fIhbDPy7pqRv5vlQs7dK8SFzHGR2QdmK4zovw2PsyRnfaybJi/BQV8MPmqFil/xBHlLPRxvKsosux8WqKzEGIauyJEke8dUQes6qdPLHMBOB6LfQkhFyk1akLXvSQ==',
  },
  tri: {
    iv: 'tTlVMkzHmOBzyH9OiMBn+Q==',
    ephemPublicKey:
      'BDqXaiba7KB7F40K11FhgadWAheZNiutrywVWU2d1JUFXyBhe3IDWrNXZXlBRpPbAZ7SVj1F8rEc7o3ktcZNq6o=',
    mac: 'X98kEPpSk3e1X67qkI18uhIyM7OdDdmyWks0sRWlzLE=',
    encoding: 'base64',
    algo: 'ECIES',
    ciphertext:
      'oO8FVKJdihs8reNyVaXwrjCP57ahxWPI69XjNXon1B7VLMmQyAJJuYakYIT1rwT+c6y5+y3+UhJAmED7/sL8gCIs9lxFG/OkS4NlYMdCwD5vyVKQx4BHs3gUiyWRIooib4icG+ItByfDYdPKiuitta3B5r7MZuO752C+X+GRwcw=',
  },
});

jest.mock('../src/models/Order', () => {
  return jest.fn().mockImplementation((id) => {
    if (id !== '100' && id !== '101' && id !== '102') {
      throw new Error('Order doesnot exists');
    }

    return {
      getParentOrder(): BlockchainId | null {
        return id === '102' ? null : '101';
      },
      getOrderInfo(): object {
        return {
          offer: '',
          args: {
            inputOffersIds: ['10'],
          },
        };
      },
    };
  });
});

jest.mock('../src/models/Offer', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getInfo(): object {
        return {
          linkage: JSON.stringify({
            encoding: Encoding.base64,
            mrenclave: '',
            mrsigner: '',
          }),
          restrictions: {
            offers: ['10'],
            types: [OfferType.Storage],
            versions: [0],
          },
          hash: JSON.stringify({
            encoding: 'hex',
            algo: 'md5',
            hash: '875e64e17e414b21b4a029bf88ff2ba0',
          }),
        } as OfferInfo;
      },
    };
  });
});

jest.mock('../src/models/TeeOffer', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getInfo(): object {
        return {
          argsPublicKey,
        } as TeeOfferInfo;
      },
      getActualTcbId(): string {
        return '1';
      },
    };
  });
});

jest.mock('../src/models/TCB', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getUtilityData(): object {
        return {
          pubKey:
            'BEXT7IKv0Rm0OU62BqTrxyA+0nqZygZKnOS5n1rs3mL4WNZ5zZcBaoLSlnXZ7hvp1oZjMoxrNSGmwEjhzfrNuN0=',
          quote: 'AwACAAAAAAAKAA8Ak5pyM...tLQoA',
        } as TcbUtilityData;
      },
    };
  });
});

jest.mock('../src/tee/TeeBlockVerifier.ts', () => {
  return {
    TeeBlockVerifier: {
      verifyTcb: jest.fn().mockResolvedValue(undefined),
    },
  };
});

jest.mock('../src/tee/QuoteValidator', () => {
  const QuoteValidatorMock = jest.fn().mockImplementation(() => {
    return {
      isDefault: false,
      baseUrl: 'https://pccs.superprotocol.io',
      validate: (): ValidationResult => ({
        quoteValidationStatus: QuoteValidationStatuses.UpToDate,
        description: 'The Quote verification passed and is at the latest TCB level.',
      }),
      isQuoteHasUserData: (): boolean => true,
    };
  });

  return {
    QuoteValidator: Object.assign(QuoteValidatorMock, {
      checkSignature: () => Promise.resolve(),
    }),
  };
});

describe('TIIGenerator', () => {
  let resource!: Resource;
  let fileEncryptoAlgoDeps!: object;

  beforeEach(() => {
    resource = {
      type: ResourceType.StorageProvider,
      storageType: StorageType.StorJ,
      filepath: '/foo/bar',
      credentials: {
        token: 'abc',
      },
    } as StorageProviderResource;

    fileEncryptoAlgoDeps = {
      iv: '1234',
      mac: '4578',
    };
  });

  describe('generateByOffer', () => {
    test('generate TII', async () => {
      const tii = await TIIGenerator.generateByOffer({
        offerId: '10',
        solutionHashes: [],
        linkageString: JSON.stringify({
          encoding: Encoding.base64,
          mrenclave: '',
          mrsigner: '',
        }),
        imageHashes: [],
        resource,
        args: {},
        encryption: {
          algo: fileEncryptionAlgo,
          encoding: Encoding.base64,
          key: key,
          ...fileEncryptoAlgoDeps,
        },
        sgxApiUrl: 'https://pccs.superprotocol.io',
      });

      expect(typeof tii).toBe('string');

      const tiiObj = JSON.parse(tii);

      expect(tiiObj).toHaveProperty('encryptedResource');
      expect(tiiObj).toHaveProperty('tri');
    });
  });

  describe('generate', () => {
    test('generate TII', async () => {
      const tii = await TIIGenerator.generate(
        '100',
        resource,
        {},
        {
          algo: fileEncryptionAlgo,
          encoding: Encoding.base64,
          key: key,
          ...fileEncryptoAlgoDeps,
        },
        'https://pccs.superprotocol.io',
      );

      expect(typeof tii).toBe('string');

      const tiiObj = JSON.parse(tii);

      expect(tiiObj).toHaveProperty('encryptedResource');
      expect(tiiObj).toHaveProperty('tri');
    });

    test('fail for no Order', () => {
      void expect(
        TIIGenerator.generate(
          '1000',
          resource,
          {},
          {
            algo: fileEncryptionAlgo,
            encoding: Encoding.base64,
            key,
            ...fileEncryptoAlgoDeps,
          },
          'https://pccs.superprotocol.io',
        ),
      ).rejects.toThrowError();
    });

    test('fail for no parent Order', () => {
      void expect(
        TIIGenerator.generate(
          '102',
          resource,
          {},
          {
            algo: fileEncryptionAlgo,
            encoding: Encoding.base64,
            key: key,
            ...fileEncryptoAlgoDeps,
          },
          'https://pccs.superprotocol.io',
        ),
      ).rejects.toThrowError();
    });
  });

  describe('getTRI', () => {
    test('get TRI', async () => {
      const tri = await TIIGenerator.getTRI(tii, Buffer.from(argsPrivateKey, 'base64'));

      expect(tri).toHaveProperty('solutionHashes');
      expect(tri).toHaveProperty('args');
      expect(tri).toHaveProperty('encryption');
      expect(tri.encryption).toEqual({
        algo: fileEncryptionAlgo,
        encoding: Encoding.base64,
        key: key,
        ...fileEncryptoAlgoDeps,
      });
    });

    test('incorrect encription key', () => {
      void expect(
        TIIGenerator.getTRI(tii, Buffer.from(argsPrivateKeyIncorrect, 'base64')),
      ).rejects.toThrowError();
    });
  });

  describe('getResource', () => {
    test('get resource', async () => {
      const resource = await TIIGenerator.getResource(tii, Buffer.from(argsPrivateKey, 'base64'));

      expect(resource).toEqual(resource);
    });

    test('incorrect encription key', () => {
      void expect(
        TIIGenerator.getResource(tii, Buffer.from(argsPrivateKeyIncorrect, 'base64')),
      ).rejects.toThrowError();
    });
  });
});
