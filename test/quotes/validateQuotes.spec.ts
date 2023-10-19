import { QuoteValidator } from '../../src/tee/QuoteValidator';
import { QuoteValidationStatuses } from '../../src/tee/statuses';
import { testQuotes, quotesUserDatas } from './examples';

describe('Quote validator', () => {
    const validator = new QuoteValidator();

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    describe('Validation tests with Intel SGX API', () => {
        test('test quote', async () => {
            const quoteBuffer = Buffer.from(testQuotes.testQuote, 'base64');
            const res = await validator.validate(quoteBuffer);
            expect(res).toBeDefined();
            expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.SecurityPatchNeeded);
        }, 15000);

        test('provisioner quote', async () => {
            const quoteBuffer = Buffer.from(testQuotes.provisionerQuote, 'base64');
            const res = await validator.validate(quoteBuffer);
            expect(res).toBeDefined();
            expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.SecurityPatchNeeded);
        }, 15000);

        test('tunnel quote', async () => {
            const quoteBuffer = Buffer.from(testQuotes.tunnelQuote, 'base64');
            const res = await validator.validate(quoteBuffer);
            expect(res).toBeDefined();
            expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.SecurityPatchNeeded);
        }, 15000);

        test('invalid quote', async () => {
            const quoteBuffer = Buffer.from(testQuotes.invalidQuote, 'base64');
            const res = await validator.validate(quoteBuffer);
            expect(res).toBeDefined();
            expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.Error);
        }, 15000);
    });

    describe('Validation tests with mocks', () => {
        test('up to date status', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jest.spyOn(validator as any, 'getTcbStatus').mockImplementation(() => 'UpToDate');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jest.spyOn(validator as any, 'getQEIdentityStatus').mockImplementation(
                () => 'UpToDate',
            );
            const quoteBuffer = Buffer.from(testQuotes.tunnelQuote, 'base64');
            const res = await validator.validate(quoteBuffer);
            expect(res).toBeDefined();
            expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.UpToDate);
        }, 15000);

        test('up to date status', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jest.spyOn(validator as any, 'getTcbStatus').mockImplementation(
                () => 'ConfigurationAndSWHardeningNeeded',
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jest.spyOn(validator as any, 'getQEIdentityStatus').mockImplementation(
                () => 'UpToDate',
            );
            const quoteBuffer = Buffer.from(testQuotes.tunnelQuote, 'base64');
            const res = await validator.validate(quoteBuffer);
            expect(res).toBeDefined();
            expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.SoftwareUpdateNeeded);
        }, 15000);

        test('up to date status', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jest.spyOn(validator as any, 'getTcbStatus').mockImplementation(
                () => 'ConfigurationNeeded',
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jest.spyOn(validator as any, 'getQEIdentityStatus').mockImplementation(
                () => 'UpToDate',
            );
            const quoteBuffer = Buffer.from(testQuotes.tunnelQuote, 'base64');
            const res = await validator.validate(quoteBuffer);
            expect(res).toBeDefined();
            expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.ConfigurationNeeded);
        }, 15000);
    });

    describe('User data tests', () => {
        test('test quote and user data', () => {
            const quoteBuffer = Buffer.from(testQuotes.testQuote, 'base64');
            const res = validator.isQuoteHasUserData(quoteBuffer, quotesUserDatas.testUserData);
            expect(res).toBeDefined();
            expect(res).toEqual(true);
        }, 15000);

        test('provisioner quote and user data', () => {
            const quoteBuffer = Buffer.from(testQuotes.provisionerQuote, 'base64');
            const res = validator.isQuoteHasUserData(
                quoteBuffer,
                quotesUserDatas.provisionerUserData,
            );
            expect(res).toBeDefined();
            expect(res).toEqual(true);
        }, 15000);

        test('tunnel quote and user data', () => {
            const quoteBuffer = Buffer.from(testQuotes.tunnelQuote, 'base64');
            const res = validator.isQuoteHasUserData(quoteBuffer, quotesUserDatas.tunnelUserData);
            expect(res).toBeDefined();
            expect(res).toEqual(true);
        }, 15000);

        test('tunnel quote and provisioner user data', () => {
            const quoteBuffer = Buffer.from(testQuotes.tunnelQuote, 'base64');
            const res = validator.isQuoteHasUserData(
                quoteBuffer,
                Buffer.from(quotesUserDatas.provisionerUserData),
            );
            expect(res).toBeDefined();
            expect(res).toEqual(true);
        }, 15000);

        test('tunnel quote and test user data', () => {
            const quoteBuffer = Buffer.from(testQuotes.tunnelQuote, 'base64');
            const res = validator.isQuoteHasUserData(
                quoteBuffer,
                Buffer.from(quotesUserDatas.testUserData),
            );
            expect(res).toBeDefined();
            expect(res).toEqual(false);
        }, 15000);
    });
});
