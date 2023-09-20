import { QuoteValidator } from '../../src/tee/QuoteValidator';
import { testQuotes } from './examples';

describe('Test quotes validatator', () => {
    const validator = new QuoteValidator();

    test('test quote', async () => {
        const quoteBuffer = Buffer.from(testQuotes.testQuote, 'base64');
        const res = await validator.validate(quoteBuffer);
        expect(res).toEqual(true);
    });

    test.skip('provisioner quote', async () => {
        const quoteBuffer = Buffer.from(testQuotes.provisionerQuote, 'base64');
        const res = await validator.validate(quoteBuffer);
        expect(res).toEqual(true);
    });

    test.skip('tunnel quote', async () => {
        const quoteBuffer = Buffer.from(testQuotes.tunnelQuote, 'base64');
        const res = await validator.validate(quoteBuffer);
        expect(res).toEqual(true);
    });
});
