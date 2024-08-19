import { Certificate } from '@fidm/x509';
import * as asn1js from 'asn1js';
import * as pkijs from 'pkijs';
import { Buffer as Blob } from 'buffer';
import { TeeQuoteParserError } from './errors.js';
import {
  BinaryType,
  TeeSgxQuoteDataType,
  TeeSgxReportDataType,
  ChunkedX509Cert,
  TeeTdxQuoteDataType,
  TeeTdxBodyType,
  TeeTdxHeaderData,
  QuoteType,
} from './types.js';
import { splitChain, Signature } from './helpers.js';
import * as crypto from 'crypto';

export abstract class TeeParser {
  protected extractRS(cert: pkijs.Certificate): { r: string; s: string; derSignature: string } {
    const derSignature = Buffer.from(cert.signatureValue.valueBlock.valueHexView).toString('hex');
    const parsedSignature = Signature.importFromDER(derSignature);

    return {
      r: parsedSignature.r,
      s: parsedSignature.s,
      derSignature,
    };
  }

  protected parsePem(pem: string): ChunkedX509Cert {
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

  protected getDataAndAdvance(blob: { data: Blob }, size: number): Blob {
    const buf = Blob.from(blob.data.subarray(0, size));
    blob.data = Blob.from(blob.data.subarray(size));

    return buf;
  }

  public static determineQuoteType(quote: BinaryType): { type: QuoteType; version: number } {
    let type = QuoteType.SGX;

    if (quote.length < 48) {
      throw new TeeQuoteParserError('data has invalid length');
    }

    const version = Buffer.from(quote).readUInt16LE(0);

    if (version === 4) {
      const quoteType = Buffer.from(quote).readUInt32LE(4);
      if (quoteType === 0x00000081) {
        type = QuoteType.TDX;
      } else if (quoteType !== 0x00000000) {
        throw new TeeQuoteParserError(`Unknown quote type ${quoteType}`);
      }
    } else if (version !== 3) {
      throw new TeeQuoteParserError(`Unknown quote version ${version}`);
    }

    return { type, version };
  }

  public static getMrEnclave(quote: BinaryType): BinaryType {
    const teeType = TeeParser.determineQuoteType(quote);
    switch (teeType.type) {
      case QuoteType.SGX:
          const sgxParser = new TeeSgxParser();
          const parsedSgxQuote = sgxParser.parseQuote(quote);
          const parsedReport = sgxParser.parseReport(parsedSgxQuote.report);
          return parsedReport.mrEnclave;
      case QuoteType.TDX:
          const tdxParser = new TeeTdxParser();
          const parsedTdxQuote = tdxParser.parseQuote(quote);
          const tdBody = tdxParser.parseBody(parsedTdxQuote.tdQuoteBody);
          const hash = crypto.createHash('sha256');
          hash.update(tdBody.tdAttributes);
          hash.update(tdBody.mrTd);
          hash.update(tdBody.rtmr0);
          hash.update(tdBody.rtmr1);
          hash.update(tdBody.rtmr2);
          hash.update(tdBody.rtmr3);
          return hash.digest();
      default:
        throw new TeeQuoteParserError(`Unknown quote type`);
    }
  }
}

export class TeeSgxParser extends TeeParser {
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
      quoteType: QuoteType.SGX,
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

export class TeeTdxParser extends TeeParser {
  //High-level quote structure
  static readonly quoteHeaderSize = 48;
  static readonly tdQuoteBodySize = 584;
  static readonly quoteSignatureDataLen = 4;

  // Header fields
  static readonly headerVersionSize = 2;
  static readonly headerAttestationKeyTypeSize = 2;
  static readonly headerTeeTypeSize = 4;
  static readonly headerReserved1Size = 2;
  static readonly headerReserved2Size = 2;
  static readonly headerQeVendorIdSize = 16;
  static readonly headerUserDataSize = 20;

  // Body fiedls
  static readonly bodyTeeTcbSvnSize = 16;
  static readonly bodyMrSeamSize = 48;
  static readonly bodyMrSignerSeamSize = 48;
  static readonly bodySeamAttributesSize = 8;
  static readonly bodyTdAttributesSize = 8;
  static readonly bodyXfamSize = 8;
  static readonly bodyMrTdSize = 48;
  static readonly bodyMrConfigIdSize = 48;
  static readonly bodyMrOwnerSize = 48;
  static readonly bodyMrOwnerConfigSize = 48;
  static readonly bodyRtmr0Size = 48;
  static readonly bodyRtmr1Size = 48;
  static readonly bodyRtmr2Size = 48;
  static readonly bodyRtmr3Size = 48;
  static readonly bodyReportDataSize = 64;

  // Signature fields
  static readonly sigQuoteSignatureSize = 64;
  static readonly sigAttestationKeySize = 64;
  static readonly sigCertDataTypeSize = 2;
  static readonly sigCertDataSzSize = 4;
  static readonly sigQeReportSize = 384;
  static readonly sigQeReportSignatureSize = 64;
  static readonly sigQeAuthenticationDataSzSize = 2;
  static readonly sigSignatureTypeSize = 2;
  static readonly sigSignatureSzSize = 4;

  parseQuote(data: BinaryType): TeeTdxQuoteDataType {
    const {
      quoteHeaderSize,
      tdQuoteBodySize,
      quoteSignatureDataLen,

      sigQuoteSignatureSize,
      sigAttestationKeySize,
      sigCertDataTypeSize,
      sigCertDataSzSize,
      sigQeReportSize,
      sigQeReportSignatureSize,
      sigQeAuthenticationDataSzSize,
      sigSignatureTypeSize,
      sigSignatureSzSize,
    } = TeeTdxParser;

    const expectedSize = quoteHeaderSize + tdQuoteBodySize + quoteSignatureDataLen;
    if (data.length < expectedSize) {
      throw new TeeQuoteParserError(
        `quote has invalid length ${data.length}, expected not less than ${expectedSize}`,
      );
    }

    const quoteRemainder = { data: Blob.from(data) };
    const rawHeader = this.getDataAndAdvance(quoteRemainder, quoteHeaderSize);
    const tdQuoteBody = this.getDataAndAdvance(quoteRemainder, tdQuoteBodySize);
    const signatureLen = this.getDataAndAdvance(quoteRemainder, quoteSignatureDataLen);
    const certificationDataSize = signatureLen.readUInt32LE(0);

    const expectedQuoteLen =
      quoteHeaderSize + tdQuoteBodySize + quoteSignatureDataLen + certificationDataSize;
    if (data.length < expectedQuoteLen) {
      throw new TeeQuoteParserError(
        `quote has invalid length ${data.length}, expected not less than ${expectedQuoteLen}`,
      );
    }

    const signature = { data: this.getDataAndAdvance(quoteRemainder, certificationDataSize) };

    const quoteSignature = this.getDataAndAdvance(signature, sigQuoteSignatureSize);
    const ecdsaAttestationKey = this.getDataAndAdvance(signature, sigAttestationKeySize);

    const certDataType = this.getDataAndAdvance(signature, sigCertDataTypeSize).readUint16LE(); //expected 6
    if (certDataType !== 6)
      throw new TeeQuoteParserError(`certDataType has invalid value ${certDataType}, expected 6`);

    const certDataSize = this.getDataAndAdvance(signature, sigCertDataSzSize).readUint32LE();

    if (signature.data.length < certDataSize)
      throw new TeeQuoteParserError(
        `certData has invalid length ${data.length}, expected not less than ${certDataSize}`,
      );

    const qeReport = this.getDataAndAdvance(signature, sigQeReportSize);
    const qeReportSignature = this.getDataAndAdvance(signature, sigQeReportSignatureSize);

    const qeAuthenticationDataSize = this.getDataAndAdvance(
      signature,
      sigQeAuthenticationDataSzSize,
    ).readUint16LE();

    if (signature.data.length < qeAuthenticationDataSize)
      throw new TeeQuoteParserError(
        `qeAuthenticationData has invalid length ${data.length}, expected not less than ${qeAuthenticationDataSize}`,
      );

    const qeAuthenticationData = this.getDataAndAdvance(signature, qeAuthenticationDataSize);

    const qeCertificationDataType = this.getDataAndAdvance(
      signature,
      sigSignatureTypeSize,
    ).readUint16LE(); //expected 5
    if (qeCertificationDataType !== 5)
      throw new TeeQuoteParserError(
        `signatureType has invalid value ${qeCertificationDataType}, expected 5`,
      );

    const signatureSize = this.getDataAndAdvance(signature, sigSignatureSzSize).readUint32LE();

    if (signature.data.length < signatureSize)
      throw new TeeQuoteParserError(
        `certChain has invalid length ${data.length}, expected not less than ${signatureSize}`,
      );

    const qeCertificationData = this.getDataAndAdvance(signature, signatureSize);

    const certsPems = splitChain(qeCertificationData.toString()); // [device, platform, root]
    const certsData = certsPems.map((pem) => this.parsePem(pem));

    return {
      quoteType: QuoteType.TDX,
      rawHeader,
      header: this.parseHeader(rawHeader),
      tdQuoteBody,
      quoteSignature,
      ecdsaAttestationKey,
      certDataType,
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

  parseHeader(data: BinaryType): TeeTdxHeaderData {
    const {
      headerVersionSize,
      headerAttestationKeyTypeSize,
      headerTeeTypeSize,
      headerReserved1Size,
      headerReserved2Size,
      headerQeVendorIdSize,
      headerUserDataSize,
    } = TeeTdxParser;

    const headerRemainder = { data: Blob.from(data) };

    const version = this.getDataAndAdvance(headerRemainder, headerVersionSize).readUInt16LE();
    const attestationKeyType = this.getDataAndAdvance(
      headerRemainder,
      headerAttestationKeyTypeSize,
    ).readUInt16LE();
    const teeType = this.getDataAndAdvance(headerRemainder, headerTeeTypeSize).readUInt32LE();
    const reserved1 = this.getDataAndAdvance(headerRemainder, headerReserved1Size);
    const reserved2 = this.getDataAndAdvance(headerRemainder, headerReserved2Size);
    const qeVendorId = this.getDataAndAdvance(headerRemainder, headerQeVendorIdSize);
    const userData = this.getDataAndAdvance(headerRemainder, headerUserDataSize);

    return {
      version,
      attestationKeyType,
      teeType,
      reserved1,
      reserved2,
      qeVendorId,
      userData,
    };
  }

  parseBody(data: BinaryType): TeeTdxBodyType {
    const {
      bodyTeeTcbSvnSize,
      bodyMrSeamSize,
      bodyMrSignerSeamSize,
      bodySeamAttributesSize,
      bodyTdAttributesSize,
      bodyXfamSize,
      bodyMrTdSize,
      bodyMrConfigIdSize,
      bodyMrOwnerSize,
      bodyMrOwnerConfigSize,
      bodyRtmr0Size,
      bodyRtmr1Size,
      bodyRtmr2Size,
      bodyRtmr3Size,
      bodyReportDataSize,
    } = TeeTdxParser;

    const bodyRemainder = { data: Blob.from(data) };

    if (bodyRemainder.data.length !== TeeTdxParser.tdQuoteBodySize)
      throw new TeeQuoteParserError(
        `body has invalid length ${bodyRemainder.data.length}, expected ${TeeTdxParser.tdQuoteBodySize}`,
      );

    const teeTcbSvn = this.getDataAndAdvance(bodyRemainder, bodyTeeTcbSvnSize);
    const mrSeam = this.getDataAndAdvance(bodyRemainder, bodyMrSeamSize);
    const mrSignerSeam = this.getDataAndAdvance(bodyRemainder, bodyMrSignerSeamSize);
    const seamAttributes = this.getDataAndAdvance(bodyRemainder, bodySeamAttributesSize);
    const tdAttributes = this.getDataAndAdvance(bodyRemainder, bodyTdAttributesSize);
    const xfam = this.getDataAndAdvance(bodyRemainder, bodyXfamSize);
    const mrTd = this.getDataAndAdvance(bodyRemainder, bodyMrTdSize);
    const mrConfigId = this.getDataAndAdvance(bodyRemainder, bodyMrConfigIdSize);
    const mrOwner = this.getDataAndAdvance(bodyRemainder, bodyMrOwnerSize);
    const mrOwnerConfig = this.getDataAndAdvance(bodyRemainder, bodyMrOwnerConfigSize);
    const rtmr0 = this.getDataAndAdvance(bodyRemainder, bodyRtmr0Size);
    const rtmr1 = this.getDataAndAdvance(bodyRemainder, bodyRtmr1Size);
    const rtmr2 = this.getDataAndAdvance(bodyRemainder, bodyRtmr2Size);
    const rtmr3 = this.getDataAndAdvance(bodyRemainder, bodyRtmr3Size);
    const reportData = this.getDataAndAdvance(bodyRemainder, bodyReportDataSize);

    return {
      teeTcbSvn,
      mrSeam,
      mrSignerSeam,
      seamAttributes,
      tdAttributes,
      xfam,
      mrTd,
      mrConfigId,
      mrOwner,
      mrOwnerConfig,
      rtmr0,
      rtmr1,
      rtmr2,
      rtmr3,
      reportData,
    };
  }
}
