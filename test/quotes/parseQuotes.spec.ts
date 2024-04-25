import { TeeSgxParser } from '../../src/tee/QuoteParser.js';
import { TeeSgxQuoteDataType, TeeSgxReportDataType } from '../../src/tee/types.js';
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
