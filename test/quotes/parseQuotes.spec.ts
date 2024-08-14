import { TeeSgxParser, TeeTdxParser, TeeParser } from '../../src/tee/QuoteParser.js';
import {
  TeeSgxQuoteDataType,
  TeeSgxReportDataType,
  TeeTdxQuoteDataType,
  TeeTdxBodyType,
  QuoteType,
} from '../../src/tee/types.js';
import * as crypto from 'crypto';
import elliptic from 'elliptic';
import { testQuotes } from './examples.js';

describe('TeeSgxParser', () => {
  const parser = new TeeSgxParser();
  let parsedQuote: TeeSgxQuoteDataType;
  let parsedQeReport: TeeSgxReportDataType;

  it('should be success to parse valid quote', () => {
    const quoteBuffer = Buffer.from(testQuotes.testQuote, 'base64');
    parsedQuote = parser.parseQuote(quoteBuffer);

    expect(parsedQuote.header.version).toEqual(3);
    expect(parsedQuote.header.attestationKeyType).toEqual(2);
    expect(parsedQuote.qeCertificationDataType).toEqual(5);
  });

  it('should be success to parse valid report', () => {
    const quoteBuffer = Buffer.from(testQuotes.testQuote, 'base64');
    const quoteData = parser.parseQuote(quoteBuffer);
    const parsedReport = parser.parseReport(quoteData.report);
    parsedQeReport = parser.parseReport(quoteData.qeReport);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((parsedReport as any).cpuSvn).toEqual('0505090affff01000000000000000000');
    expect(parsedReport.dataHash.toString('hex')).toEqual(
      '978930f65a5b51b87cf14f889bd67908caf463cb4bebcff42f92f84c84138bc9',
    );

    expect(parsedQeReport.dataHash.toString('hex')).toEqual(
      '9ec3dea3a4103b3d8a0ca899d4cd42043ebd7827636f845a128e7bf3a67608cb',
    );
  });

  it('shoud be success to verify quote', () => {
    const pubKey = parsedQuote.ecdsaAttestationKey;
    const authData = parsedQuote.qeAuthenticationData;

    const hash = crypto.createHash('sha256');
    hash.update(pubKey);
    hash.update(authData);
    expect(hash.digest('hex')).toEqual(parsedQeReport.dataHash.toString('hex'));

    const key = Buffer.concat([Buffer.from([4]), pubKey]); //add header to pub key
    const ec = new elliptic.ec('p256');
    const signature = parsedQuote.isvEnclaveReportSignature;
    const res = ec.verify(
      crypto
        .createHash('sha256')
        .update(Buffer.concat([parsedQuote.rawHeader, parsedQuote.report]))
        .digest(),
      { r: signature.subarray(0, 32), s: signature.subarray(32) },
      key,
    );
    expect(res).toEqual(true);
  });

  it('should fail to parse invalid quote', () => {
    expect(() => {
      parser.parseQuote(Buffer.from(testQuotes.invalidQuote, 'base64'));
    }).toThrowError('invalid or unsupported attestation key type');
  });
});

describe('TeeTdxParser', () => {
  const parser = new TeeTdxParser();
  let parsedQuote: TeeTdxQuoteDataType;
  let parsedTdxBody: TeeTdxBodyType;

  it('should be success to parse valid quote', () => {
    const quoteBuffer = Buffer.from(testQuotes.tdxQuote, 'base64');
    parsedQuote = parser.parseQuote(quoteBuffer);

    expect(parsedQuote.header.version).toEqual(4);
    expect(parsedQuote.header.attestationKeyType).toEqual(2);
    expect(parsedQuote.qeCertificationDataType).toEqual(5);
  });

  it('should be success to parse valid body', () => {
    parsedTdxBody = parser.parseBody(parsedQuote.tdQuoteBody);

    expect(parsedTdxBody.reportData.toString('hex')).toEqual(
      '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f',
    );
    expect(parsedTdxBody.rtmr0.toString('hex')).toEqual(
      '35d72eb062f4572a683ca413b5dd8c355bec821c78a0aaa4ca6705481caac87f6a4ad09e05b75dc789768ebc9d111c10',
    );
    expect(parsedTdxBody.rtmr1.toString('hex')).toEqual(
      '6e70db6dbd6047c6cedcd8d5958d1a0cba7c10c2551f7c1be397e066edcf8fcbe71aad0613726511fb6fbeb8d947878e',
    );
    expect(parsedTdxBody.rtmr2.toString('hex')).toEqual(
      '5e5a5b576e55d05b03433e1c9ada98205a952616ceea25aec8aa7b3b79e83bce0581736884a87a93196b63c43ce001ab',
    );
    expect(parsedTdxBody.rtmr3.toString('hex')).toEqual(
      '2c607bda56e155ca41c9a1c81edcc0555436b4995f22ee06c050925aaabdc218c641a188d8dfdd3bf59b1ccd68baba3c',
    );
  });

  it('shoud be success to verify quote', () => {
    const pubKey = parsedQuote.ecdsaAttestationKey;
    const authData = parsedQuote.qeAuthenticationData;
    const sgxParser = new TeeSgxParser();
    const parsedQeReport = sgxParser.parseReport(parsedQuote.qeReport);

    const hash = crypto.createHash('sha256');
    hash.update(pubKey);
    hash.update(authData);
    expect(hash.digest('hex')).toEqual(parsedQeReport.dataHash.toString('hex'));

    const key = Buffer.concat([Buffer.from([4]), pubKey]); //add header to pub key
    const ec = new elliptic.ec('p256');
    const signature = parsedQuote.quoteSignature;
    const res = ec.verify(
      crypto
        .createHash('sha256')
        .update(Buffer.concat([parsedQuote.rawHeader, parsedQuote.tdQuoteBody]))
        .digest(),
      { r: signature.subarray(0, 32), s: signature.subarray(32) },
      key,
    );
    expect(res).toEqual(true);
  });
});

describe('Determine qoute type', () => {
  it('should be sgx quote', () => {
    const quoteBuffer = Buffer.from(testQuotes.testQuote, 'base64');
    const type = TeeParser.determineQuoteType(quoteBuffer);
    expect(type.type).toEqual(QuoteType.SGX);
    expect(type.version).toEqual(3);
  });

  it('should be tdx quote', () => {
    const quoteBuffer = Buffer.from(testQuotes.tdxQuote, 'base64');
    const type = TeeParser.determineQuoteType(quoteBuffer);
    expect(type.type).toEqual(QuoteType.TDX);
    expect(type.version).toEqual(4);
  });
});
