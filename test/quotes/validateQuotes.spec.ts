import { QuoteValidator } from '../../src/tee/QuoteValidator';
import { QuoteValidationStatuses } from '../../src/tee/statuses';
import { testQuotes, quotesUserDatas } from './examples';

// TODO: mock network queries and cover all possible states
describe('Quote validator', () => {
    const validator = new QuoteValidator();

    describe('Validation tests with Intel SGX API', () => {
        test('test quote', async () => {
            const quoteBuffer = Buffer.from(testQuotes.testQuote, 'base64');
            const res = await validator.validate(quoteBuffer);
            expect(res).toBeDefined();
            expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.SecurityPatchNeeded);
        }, 10000);

        test('provisioner quote', async () => {
            const quoteBuffer = Buffer.from(testQuotes.provisionerQuote, 'base64');
            const res = await validator.validate(quoteBuffer);
            expect(res).toBeDefined();
            expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.SecurityPatchNeeded);
        }, 10000);

        test('tunnel quote', async () => {
            const quoteBuffer = Buffer.from(testQuotes.tunnelQuote, 'base64');
            const res = await validator.validate(quoteBuffer);
            expect(res).toBeDefined();
            expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.SecurityPatchNeeded);
        }, 10000);
    });

    describe('User data tests', () => {
        test('test quote and user data', () => {
            const quoteBuffer = Buffer.from(testQuotes.testQuote, 'base64');
            const res = validator.hasQuoteUserData(quoteBuffer, quotesUserDatas.testUserData);
            expect(res).toBeDefined();
            expect(res).toEqual(true);
        }, 10000);

        test('provisioner quote and user data', () => {
            const quoteBuffer = Buffer.from(testQuotes.provisionerQuote, 'base64');
            const res = validator.hasQuoteUserData(
                quoteBuffer,
                quotesUserDatas.provisionerUserData,
            );
            expect(res).toBeDefined();
            expect(res).toEqual(true);
        }, 10000);

        test('tunnel quote and user data', () => {
            const quoteBuffer = Buffer.from(testQuotes.tunnelQuote, 'base64');
            const res = validator.hasQuoteUserData(quoteBuffer, quotesUserDatas.tunnelUserData);
            expect(res).toBeDefined();
            expect(res).toEqual(true);
        }, 10000);

        test('tunnel quote and provisioner user data', () => {
            const quoteBuffer = Buffer.from(testQuotes.tunnelQuote, 'base64');
            const res = validator.hasQuoteUserData(
                quoteBuffer,
                Buffer.from(quotesUserDatas.provisionerUserData),
            );
            expect(res).toBeDefined();
            expect(res).toEqual(true);
        }, 10000);

        test('tunnel quote and test user data', () => {
            const quoteBuffer = Buffer.from(testQuotes.tunnelQuote, 'base64');
            const res = validator.hasQuoteUserData(
                quoteBuffer,
                Buffer.from(quotesUserDatas.testUserData),
            );
            expect(res).toBeDefined();
            expect(res).toEqual(false);
        }, 10000);
    });
});
