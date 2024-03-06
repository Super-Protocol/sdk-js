import { Certificate } from '@fidm/x509';
import * as asn1js from 'asn1js';
import * as pkijs from 'pkijs';
import { Buffer as Blob } from 'buffer';
import { TeeQuoteParserError } from './errors.js';
import { BinaryType, TeeSgxQuoteDataType, TeeSgxReportDataType, ChunkedX509Cert } from './types.js';
import { splitChain, Signature } from './helpers.js';

export class TeeSgxParser {
  static readonly quoteHeaderSize = 48;
  static readonly pceSvnOffset = 10;
  static readonly reportSize = 384;
  static readonly userDataOffset = 28;
  static readonly userDataSize = 20;
  static readonly cpuSvnSize = 16;
  static readonly reportMrEnclaveOffset = 64;
  static readonly reportMrEnclaveSize = 32;
  static readonly reportMrSignerOffset =
    TeeSgxParser.reportMrEnclaveOffset + TeeSgxParser.reportMrEnclaveSize + /* reserved */ 32;
  static readonly reportMrSignerSize = 32;
  static readonly reportIsvProdIdOffset =
    TeeSgxParser.reportMrSignerOffset + TeeSgxParser.reportMrSignerSize + /* reserved */ 96;
  static readonly reportIsvProdIdSize = 2;
  static readonly reportIsvSvnOffset =
    TeeSgxParser.reportIsvProdIdOffset + TeeSgxParser.reportIsvProdIdSize;
  static readonly reportIsvSvnSize = 2;
  static readonly reportDataOffset =
    TeeSgxParser.reportIsvSvnOffset + TeeSgxParser.reportIsvSvnSize + /* reserved */ 60;
  static readonly reportUserDataSize = 64;
  static readonly reportUserDataSHA256Size = 32; /* 64 in report, but we need 32 only for sha256 hash */
  static readonly ecdsaP256SignatureSize = 64;
  static readonly ecdsaP256PublicKeySize = 64;

  private getDataAndAdvance(blob: { data: Blob }, size: number): Blob {
    const buf = Blob.from(blob.data.subarray(0, size));
    blob.data = Blob.from(blob.data.subarray(size));

    return buf;
  }

  private extractRS(cert: pkijs.Certificate): { r: string; s: string; derSignature: string } {
    const derSignature = Buffer.from(cert.signatureValue.valueBlock.valueHexView).toString('hex');
    const parsedSignature = Signature.importFromDER(derSignature);

    return {
      r: parsedSignature.r,
      s: parsedSignature.s,
      derSignature,
    };
  }

  private parsePem(pem: string): ChunkedX509Cert {
    const cert = Certificate.fromPEM(Buffer.from(pem));
    const asn1Certificate = asn1js.fromBER(cert.raw);
    const certificate = new pkijs.Certificate({ schema: asn1Certificate.result });

    const tbs = certificate.tbsView;

    const { r, s } = this.extractRS(certificate);

    const publicKey = cert.publicKey.keyRaw.toString('hex').slice(2);
    const splitedTbs = Buffer.from(tbs).toString('hex').split(publicKey);
    const x509PublicKey = '0x' + publicKey;
    const x509Signature = '0x' + r + s;

    return {
      bodyPartOne: '0x' + splitedTbs[0],
      publicKey: x509PublicKey,
      bodyPartTwo: '0x' + splitedTbs[1],
      signature: x509Signature,
    };
  }

  parseQuote(data: BinaryType): TeeSgxQuoteDataType {
    const {
      quoteHeaderSize,
      pceSvnOffset,
      reportSize,
      userDataOffset,
      userDataSize,
      ecdsaP256SignatureSize,
      ecdsaP256PublicKeySize,
    } = TeeSgxParser;

    if (data.length < quoteHeaderSize + reportSize) {
      throw new TeeQuoteParserError('data has invalid length');
    }
    const quoteRemainder = { data: Blob.from(data) };
    const quoteHeader = this.getDataAndAdvance(quoteRemainder, quoteHeaderSize);
    const report = this.getDataAndAdvance(quoteRemainder, reportSize);

    const version = quoteHeader.readUInt16LE(0);

    const attestationKeyType = quoteHeader.readUInt16LE(2);

    if (attestationKeyType > 3) {
      throw new TeeQuoteParserError('quote header has invalid or unsupported attestation key type');
    }

    const pceSvn = quoteHeader.readUInt16LE(pceSvnOffset);

    const userData = quoteHeader.slice(userDataOffset, userDataOffset + userDataSize);

    const quoteSignatureDateLen = quoteRemainder.data.readUInt32LE(0);
    quoteRemainder.data = Blob.from(quoteRemainder.data.subarray(4));

    if (quoteSignatureDateLen != quoteRemainder.data.length) {
      throw new TeeQuoteParserError(
        `quoteSignatureDateLen has invalid length: ${quoteRemainder.data.length} instead of ${quoteSignatureDateLen} expected`,
      );
    }

    const rawQuoteSignatureDataRemainder = {
      data: this.getDataAndAdvance(quoteRemainder, quoteSignatureDateLen),
    };
    const isvEnclaveReportSignature = this.getDataAndAdvance(
      rawQuoteSignatureDataRemainder,
      ecdsaP256SignatureSize,
    );
    const ecdsaAttestationKey = this.getDataAndAdvance(
      rawQuoteSignatureDataRemainder,
      ecdsaP256PublicKeySize,
    );
    const qeReport = this.getDataAndAdvance(rawQuoteSignatureDataRemainder, reportSize);
    const qeReportSignature = this.getDataAndAdvance(
      rawQuoteSignatureDataRemainder,
      ecdsaP256SignatureSize,
    );
    const qeAuthenticationDataSize = rawQuoteSignatureDataRemainder.data.readUInt16LE(0);
    rawQuoteSignatureDataRemainder.data = Blob.from(
      rawQuoteSignatureDataRemainder.data.subarray(2),
    );

    if (rawQuoteSignatureDataRemainder.data.length < qeAuthenticationDataSize) {
      throw new TeeQuoteParserError(
        `qeAuthenticationDataSize has invalid length: ${rawQuoteSignatureDataRemainder.data.length} instead of ${qeAuthenticationDataSize} expected`,
      );
    }

    const qeAuthenticationData = this.getDataAndAdvance(
      rawQuoteSignatureDataRemainder,
      qeAuthenticationDataSize,
    );

    const qeCertificationDataType = rawQuoteSignatureDataRemainder.data.readUInt16LE(0);

    if (qeCertificationDataType < 1 || qeCertificationDataType > 7) {
      throw new TeeQuoteParserError(
        `certificationDataType has invalid value: ${qeCertificationDataType}`,
      );
    }

    const certificationDataSize = rawQuoteSignatureDataRemainder.data.readUInt32LE(2);
    const qeCertificationData = rawQuoteSignatureDataRemainder.data.subarray(2 + 4);

    if (certificationDataSize != qeCertificationData.length) {
      throw new TeeQuoteParserError(
        `certificationDataSize has invalid length: $PqeCertificationData.length} instead of ${certificationDataSize} expected`,
      );
    }

    const certsPems = splitChain(qeCertificationData.toString()); // [device, platform, root]
    const certsData = certsPems.map((pem) => this.parsePem(pem));

    return {
      rawHeader: quoteHeader,
      header: {
        version,
        attestationKeyType,
        pceSvn,
        userData,
      },
      report,
      isvEnclaveReportSignature,
      ecdsaAttestationKey,
      qeReport,
      qeReportSignature,
      qeAuthenticationData,
      qeCertificationDataType,
      qeCertificationData,
      certificates: {
        device: {
          pem: certsPems[0],
          x509Data: certsData[0],
        },
        platform: {
          pem: certsPems[1],
          x509Data: certsData[1],
        },
        root: {
          pem: certsPems[2],
          x509Data: certsData[2],
        },
      },
    };
  }

  parseReport(data: BinaryType): TeeSgxReportDataType {
    const {
      reportSize,
      cpuSvnSize,
      reportMrEnclaveOffset,
      reportMrEnclaveSize,
      reportMrSignerOffset,
      reportMrSignerSize,
      reportIsvProdIdOffset,
      reportIsvProdIdSize,
      reportIsvSvnOffset,
      reportIsvSvnSize,
      reportDataOffset,
      reportUserDataSize,
      reportUserDataSHA256Size,
    } = TeeSgxParser;

    if (data.length < reportSize) {
      throw new TeeQuoteParserError('data has invalid length');
    }

    const report = Blob.from(data);
    const cpuSvn = report.slice(0, cpuSvnSize).toString('hex');
    const mrEnclave = report.slice(
      reportMrEnclaveOffset,
      reportMrEnclaveOffset + reportMrEnclaveSize,
    );
    const mrSigner = report.slice(reportMrSignerOffset, reportMrSignerOffset + reportMrSignerSize);
    const isvProdId = report
      .slice(reportIsvProdIdOffset, reportIsvProdIdOffset + reportIsvProdIdSize)
      .readUInt16LE(0);
    const isvSvn = report
      .slice(reportIsvSvnOffset, reportIsvSvnOffset + reportIsvSvnSize)
      .readUInt16LE(0);
    const userData = report.slice(reportDataOffset, reportDataOffset + reportUserDataSize);
    const dataHash = report.slice(reportDataOffset, reportDataOffset + reportUserDataSHA256Size);

    return {
      cpuSvn,
      mrEnclave,
      mrSigner,
      isvProdId,
      isvSvn,
      userData,
      dataHash,
    };
  }
}
