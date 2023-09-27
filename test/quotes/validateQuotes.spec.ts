// import { QuoteValidator } from '../../src/tee/QuoteValidator';
// import { QuoteValidationStatuses } from '../../src/tee/statuses';
// import { testQuotes } from './examples';

// // TODO: mock network queries and cover all possible states
// describe('Quote validatator', () => {
//     const validator = new QuoteValidator();

//     test('test quote', async () => {
//         const quoteBuffer = Buffer.from(testQuotes.testQuote, 'base64');
//         const res = await validator.validate(quoteBuffer);
//         expect(res).toBeDefined();
//         expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.SecurityPatchNeeded);
//     }, 10000);

//     test('provisioner quote', async () => {
//         const quoteBuffer = Buffer.from(testQuotes.provisionerQuote, 'base64');
//         const res = await validator.validate(quoteBuffer);
//         expect(res).toBeDefined();
//         expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.SecurityPatchNeeded);
//     }, 10000);

//     test('tunnel quote', async () => {
//         const quoteBuffer = Buffer.from(testQuotes.tunnelQuote, 'base64');
//         const res = await validator.validate(quoteBuffer);
//         expect(res).toBeDefined();
//         expect(res.quoteValidationStatus).toEqual(QuoteValidationStatuses.SecurityPatchNeeded);
//     }, 10000);
// });
