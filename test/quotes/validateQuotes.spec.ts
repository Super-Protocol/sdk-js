import { GetMrEnclaveSignatureFn, QuoteValidator } from '../../src/tee/QuoteValidator.js';
import { QuoteValidationStatuses } from '../../src/tee/statuses.js';
import {
  testQuotes,
  quotesUserDatas,
  platformCrlResult,
  intelCrlDer,
  tcbData,
  qeIdentityData,
  tdxTcbData,
  tdxQeIdentityData,
} from './examples.js';

jest.mock('axios', () => ({
  get: (url: string): Promise<unknown> => {
    switch (url) {
      case 'https://pccs.superprotocol.io/sgx/certification/v4/pckcrl?ca=platform&encoding=pem':
        return Promise.resolve(platformCrlResult);
      case 'https://pccs.superprotocol.io/sgx/certification/v4/crl?uri=https://certificates.trustedservices.intel.com/IntelSGXRootCA.der':
        return Promise.resolve(intelCrlDer);
      case 'https://pccs.superprotocol.io/sgx/certification/v4/tcb?fmspc=30606a000000':
        return Promise.resolve(tcbData);
      case 'https://pccs.superprotocol.io/tdx/certification/v4/tcb?fmspc=b0c06f000000':
        return Promise.resolve(tdxTcbData);
      case 'https://pccs.superprotocol.io/sgx/certification/v4/qe/identity':
        return Promise.resolve(qeIdentityData);
      case 'https://pccs.superprotocol.io/tdx/certification/v4/qe/identity':
        return Promise.resolve(tdxQeIdentityData);
      default:
        return Promise.resolve({});
    }
  },
}));

describe('Quote validator', () => {
  const validator = new QuoteValidator('https://pccs.superprotocol.io');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jest.spyOn(validator as any, 'checkValidDate').mockImplementation(() => true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jest.spyOn(validator as any, 'checkCertificatesInCrl').mockImplementation(() => true);

  describe('Validation tests with mocked Intel SGX API', () => {
    test('test quote', async () => {
      const quoteBuffer = Buffer.from(testQuotes.testQuote, 'base64');
      const res = await validator.validate(quoteBuffer);
      expect(res).toBeDefined();
      expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.SecurityPatchNeeded);
    });

    test('provisioner quote', async () => {
      const quoteBuffer = Buffer.from(testQuotes.provisionerQuote, 'base64');
      const res = await validator.validate(quoteBuffer);
      expect(res).toBeDefined();
      expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.SecurityPatchNeeded);
    });

    test('tunnel quote', async () => {
      const quoteBuffer = Buffer.from(testQuotes.tunnelQuote, 'base64');
      const res = await validator.validate(quoteBuffer);
      expect(res).toBeDefined();
      expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.SecurityPatchNeeded);
    });

    test('invalid quote', async () => {
      const quoteBuffer = Buffer.from(testQuotes.invalidQuote, 'base64');
      const res = await validator.validate(quoteBuffer);
      expect(res).toBeDefined();
      expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.Error);
    });

    test('tdx quote', async () => {
      const quoteBuffer = Buffer.from(testQuotes.tdxQuote, 'base64');
      const res = await validator.validate(quoteBuffer);
      expect(res).toBeDefined();
      expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.UpToDate);
    });
  });

  describe('Validation tests with mocks', () => {
    test('up to date status', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(validator as any, 'getTcbStatus').mockImplementation(() => 'UpToDate');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(validator as any, 'getQEIdentityStatus').mockImplementation(() => 'UpToDate');
      const quoteBuffer = Buffer.from(testQuotes.tunnelQuote, 'base64');
      const res = await validator.validate(quoteBuffer);
      expect(res).toBeDefined();
      expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.UpToDate);
    });

    test('configuration and SW hardening needed status', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest
        .spyOn(validator as any, 'getTcbStatus')
        .mockImplementation(() => 'ConfigurationAndSWHardeningNeeded');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(validator as any, 'getQEIdentityStatus').mockImplementation(() => 'UpToDate');
      const quoteBuffer = Buffer.from(testQuotes.tunnelQuote, 'base64');
      const res = await validator.validate(quoteBuffer);
      expect(res).toBeDefined();
      expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.SoftwareUpdateNeeded);
    });

    test('configuration needed status', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(validator as any, 'getTcbStatus').mockImplementation(() => 'ConfigurationNeeded');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(validator as any, 'getQEIdentityStatus').mockImplementation(() => 'UpToDate');
      const quoteBuffer = Buffer.from(testQuotes.tunnelQuote, 'base64');
      const res = await validator.validate(quoteBuffer);
      expect(res).toBeDefined();
      expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.ConfigurationNeeded);
    });
  });

  describe('User data tests', () => {
    test('tee1 quote and user data', async () => {
      const quoteBuffer = Buffer.from(testQuotes.tee1Quote, 'base64');
      const dataBuffer = Buffer.from(quotesUserDatas.tee1);
      const res = await validator.isQuoteHasUserData(quoteBuffer, dataBuffer);
      expect(res).toBeDefined();
      expect(res).toEqual(true);
    });

    test('tee23 quote and user data', async () => {
      const quoteBuffer = Buffer.from(testQuotes.tee23Quote, 'base64');
      const dataBuffer = Buffer.from(quotesUserDatas.tee23);
      const res = await validator.isQuoteHasUserData(quoteBuffer, dataBuffer);
      expect(res).toBeDefined();
      expect(res).toEqual(true);
    });

    test('tee1 quote and tee23 user data', async () => {
      const quoteBuffer = Buffer.from(testQuotes.tee1Quote, 'base64');
      const res = await validator.isQuoteHasUserData(
        quoteBuffer,
        Buffer.from(quotesUserDatas.tee23),
      );
      expect(res).toBeDefined();
      expect(res).toEqual(false);
    });

    test('tee23 quote and tee1 user data', async () => {
      const quoteBuffer = Buffer.from(testQuotes.tee23Quote, 'base64');
      const res = await validator.isQuoteHasUserData(
        quoteBuffer,
        Buffer.from(quotesUserDatas.tee1),
      );
      expect(res).toBeDefined();
      expect(res).toEqual(false);
    });
  });

  describe('Validation tests for TDX sign', () => {
    const quoteBuffer = Buffer.from(testQuotes.tdxQuoteSigned, 'base64');
    const buildGetMrEnclaveSignature = (sign: string): GetMrEnclaveSignatureFn => {
      return () => {
        return Promise.resolve(Buffer.from(sign, 'base64'));
      };
    };

    test('Valid sign', async () => {
      const getMrEnclaveSignature = buildGetMrEnclaveSignature(testQuotes.validTdxSign);

      await expect(
        QuoteValidator.checkSignature(quoteBuffer, { getMrEnclaveSignature }),
      ).resolves.not.toThrow();
    });

    test('Invalid sign', async () => {
      const getMrEnclaveSignature = buildGetMrEnclaveSignature(testQuotes.invalidTdxSign);

      await expect(
        QuoteValidator.checkSignature(quoteBuffer, { getMrEnclaveSignature }),
      ).rejects.toThrow(/TDX signature is invalid/);
    });

    test('Invalid key sign', async () => {
      const getMrEnclaveSignature = buildGetMrEnclaveSignature(testQuotes.invalidTdxSignAnotherKey);

      await expect(
        QuoteValidator.checkSignature(quoteBuffer, { getMrEnclaveSignature }),
      ).rejects.toThrow(/Encryption block is invalid/);
    });
  });
});
