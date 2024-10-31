import forge from 'node-forge';
import { TeeSgxParser } from './QuoteParser.js';
import { QuoteValidator } from './QuoteValidator.js';

export type ParseTlsCertificateResult = {
  userData: Buffer;
  mrEnclave: Buffer;
  mrSigner: Buffer;
  dataHash: Buffer;
};

export class TeeCertificateService {
  private readonly certOidQuote = '0.6.9.42.840.113741.1337.6';

  private getCertificatePublicKey(certificate: forge.pki.Certificate): Buffer {
    const publicKeyDer = forge.asn1
      .toDer(forge.pki.publicKeyToAsn1(certificate.publicKey))
      .getBytes();

    return Buffer.from(publicKeyDer, 'binary');
  }

  async parseAndValidateCertificate(
    certificatePem: forge.pki.PEM | Buffer,
    sgxApiUrl: string,
  ): Promise<ParseTlsCertificateResult> {
    const pem = Buffer.isBuffer(certificatePem) ? certificatePem.toString() : certificatePem;
    const certificate = forge.pki.certificateFromPem(pem);
    const extensions = certificate.extensions;

    const quote = extensions.find((ext) => ext.id === this.certOidQuote);
    const quoteBuffer = Buffer.from(quote.value, 'binary');
    const validator = new QuoteValidator(sgxApiUrl);
    await validator.checkQuote(quoteBuffer, this.getCertificatePublicKey(certificate));

    const parser = new TeeSgxParser();
    const parsedQuote = parser.parseQuote(quoteBuffer);
    const report = parser.parseReport(parsedQuote.report);

    return {
      userData: Buffer.from(parsedQuote.header.userData),
      mrEnclave: Buffer.from(report.mrEnclave),
      mrSigner: Buffer.from(report.mrSigner),
      dataHash: Buffer.from(report.dataHash),
    };
  }
}
