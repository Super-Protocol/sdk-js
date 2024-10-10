import axios, { AxiosResponse } from 'axios';
import { tryWithInterval } from '../utils/helpers/index.js';
import elliptic from 'elliptic';
import forge from 'node-forge';
import { Certificate, Extension } from '@fidm/x509';
import { formatter } from 'js-encoding-utils';
import { CertificateRevocationList } from 'pkijs';
import { fromBER } from 'asn1js';
import _ from 'lodash';
import { TeeSgxParser, TeeTdxParser, TeeParser } from './QuoteParser.js';
import {
  TeeSgxQuoteDataType,
  TeeSgxReportDataType,
  QuoteType,
  TeeTdxQuoteDataType,
  TeeQuoteBase,
} from './types.js';
import rootLogger from '../logger.js';
import { IQEIdentity, ITcbData } from './interface.js';
import { InvalidSignatureError, TeeQuoteValidatorError } from './errors.js';
import { QEIdentityStatuses, TCBStatuses, QuoteValidationStatuses } from './statuses.js';
import { Encoding, HashAlgorithm } from '@super-protocol/dto-js';
import Crypto from '../crypto/index.js';
import { TEE_LOADER_TRUSTED_MRSIGNER, TEE_LOADER_TRUSTED_CERTIFICATE } from '../constants.js';

const { ec } = elliptic;
const { util, asn1 } = forge;

const INTEL_BASE_SGX_URL = 'https://api.trustedservices.intel.com';
const INTEL_SGX_ROOT_CA_URL = 'https://certificates.trustedservices.intel.com/IntelSGXRootCA.der';
const SGX_OID = '1.2.840.113741.1.13.1';
const FMSPC_OID = `${SGX_OID}.4`;
const PCEID_OID = `${SGX_OID}.3`;
const TCB_OID = `${SGX_OID}.2`;
const PCESVN_OID = `${TCB_OID}.17`;
const INTEL_ROOT_PUB_KEY = new Uint8Array([
  4, 11, 169, 196, 192, 192, 200, 97, 147, 163, 254, 35, 214, 176, 44, 218, 16, 168, 187, 212, 232,
  142, 72, 180, 69, 133, 97, 163, 110, 112, 85, 37, 245, 103, 145, 142, 46, 220, 136, 228, 13, 134,
  11, 208, 204, 78, 226, 106, 172, 201, 136, 229, 5, 169, 83, 85, 140, 69, 63, 107, 9, 4, 174, 115,
  148,
]);

export interface ValidationResult {
  quoteValidationStatus: QuoteValidationStatuses;
  description: string;
  error?: unknown;
}

export type GetMrEnclaveSignatureFn = (mrEnclave: Buffer) => Promise<Buffer>;
export type CheckSignatureOptions = {
  getMrEnclaveSignature: GetMrEnclaveSignatureFn;
};

export class QuoteValidator {
  private readonly isDefault: boolean;
  private readonly baseUrl: string;
  private readonly teeSgxParser: TeeSgxParser;
  private readonly teeTdxParser: TeeTdxParser;
  private logger: typeof rootLogger;

  constructor(baseUrl: string) {
    this.isDefault = baseUrl === INTEL_BASE_SGX_URL;
    this.baseUrl = `${baseUrl}/sgx/certification/v4`;
    this.teeSgxParser = new TeeSgxParser();
    this.teeTdxParser = new TeeTdxParser();
    this.logger = rootLogger.child({ className: QuoteValidator.name });
  }

  static async getSignature(
    mrEnclave: Buffer,
    options?: {
      baseURL?: string;
      retryMax?: number;
      retryInterval?: number;
    },
  ): Promise<Buffer> {
    const baseURL = options?.baseURL ?? 'https://api.github.com/repos/Super-Protocol/sp-vm';
    const retryMax = options?.retryMax ?? 3;
    const retryInterval = options?.retryInterval ?? 1000;

    const axiosInstance = axios.create({
      baseURL,
      headers: {
        Accept: 'application/vnd.github.v3.raw',
      },
    });
    const response = await tryWithInterval<AxiosResponse>({
      checkResult(response) {
        return { isResultOk: response.status === 200 };
      },
      handler() {
        const mrenclaveHex = mrEnclave.toString('hex');

        return axiosInstance.get(`/contents/signatures/mrenclave-${mrenclaveHex}.sign`, {
          responseType: 'arraybuffer',
        });
      },
      checkError(err) {
        if (axios.isAxiosError(err) && err.response) {
          const status = err.response.status;

          return { retryable: status < 400 || status >= 500 };
        }
        return { retryable: axios.isAxiosError(err) };
      },
      retryInterval,
      retryMax,
    });

    return Buffer.from(response.data);
  }

  static async checkSignature(
    quote: Buffer,
    options: CheckSignatureOptions = { getMrEnclaveSignature: QuoteValidator.getSignature },
  ): Promise<void> {
    const { getMrEnclaveSignature } = options;
    const { type: quoteType } = TeeSgxParser.determineQuoteType(quote);

    switch (quoteType) {
      case QuoteType.SGX: {
        const parser = new TeeSgxParser();
        const parsedQuote = parser.parseQuote(quote);
        const report = parser.parseReport(parsedQuote.report);
        if (report.mrSigner.toString('hex') !== TEE_LOADER_TRUSTED_MRSIGNER.toString('hex')) {
          throw new InvalidSignatureError('Quote has an invalid MR signer');
        }
        break;
      }
      case QuoteType.TDX: {
        const mrEnclave = TeeParser.getMrEnclave(quote);
        const cert = forge.pki.certificateFromPem(TEE_LOADER_TRUSTED_CERTIFICATE);
        const isCertValid = forge.pki.verifyCertificateChain(forge.pki.createCaStore([cert]), [
          cert,
        ]);
        if (!isCertValid) {
          throw new Error('Trusted cert is invalid');
        }

        const publicKey = cert.publicKey;
        if (
          !Object.prototype.hasOwnProperty.call(publicKey, 'n') ||
          !Object.prototype.hasOwnProperty.call(publicKey, 'e')
        ) {
          throw new InvalidSignatureError('Expected RSA private key inside certificate');
        }

        const digest = forge.md.sha256
          .create()
          .update(String.fromCharCode(...mrEnclave))
          .digest();
        const signature = await getMrEnclaveSignature(Buffer.from(mrEnclave));

        const isSignatureValid = (publicKey as forge.pki.rsa.PublicKey).verify(
          digest.bytes(),
          String.fromCharCode(...signature),
        );
        if (!isSignatureValid) {
          throw new InvalidSignatureError('TDX signature is invalid');
        }

        break;
      }
    }
  }

  private splitChain(chain: string): string[] {
    const begin = '-----BEGIN CERTIFICATE-----';
    const end = '-----END CERTIFICATE-----';

    return chain
      .split(begin)
      .filter(Boolean)
      .map((cert) => begin.concat(cert.slice(0, cert.indexOf(end)), end));
  }

  private findSequenceByOID(hexValue: string, targetOID: string): forge.asn1.Asn1 | null {
    const buffer = util.hexToBytes(hexValue);
    const asn1Data = asn1.fromDer(buffer);

    return this.searchForSequence(asn1Data, targetOID);
  }

  private searchForSequence(asn1Data: forge.asn1.Asn1, targetOID: string): forge.asn1.Asn1 | null {
    if (asn1Data.type === asn1.Type.SEQUENCE) {
      for (const child of asn1Data.value as forge.asn1.Asn1[]) {
        if (child.type === asn1.Type.OID) {
          const oid = asn1.derToOid(child.value as string);
          if (oid === targetOID) {
            return asn1Data;
          }
        }
      }
    }

    if (Array.isArray(asn1Data.value)) {
      for (const child of asn1Data.value) {
        const result = this.searchForSequence(child, targetOID);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  private verifyDataBySignature(data: Buffer, signature: Buffer, key: Buffer): boolean {
    const ellipticEc = new ec('p256');

    return ellipticEc.verify(
      data,
      {
        r: signature.subarray(0, 32),
        s: signature.subarray(32),
      },
      ellipticEc.keyFromPublic(key, 'hex'),
    );
  }

  private checkValidDate(from: number, to: number): boolean {
    const now = Date.now();
    return from < now && now < to;
  }

  private checkChainForIssuers(
    pckCert: Certificate,
    platformCert: Certificate,
    rootCert: Certificate,
  ): boolean {
    return (
      _.isEqual(pckCert.issuer, platformCert.subject) &&
      _.isEqual(platformCert.issuer, rootCert.subject)
    );
  }

  private getCrl(crlData: string): CertificateRevocationList {
    const crlDer = crlData.startsWith('-----')
      ? formatter.pemToBin(crlData)
      : Buffer.from(crlData, 'hex');
    const crlAsn = fromBER(crlDer as Uint8Array);

    return new CertificateRevocationList({ schema: crlAsn.result });
  }

  private checkCertificatesInCrl(crl: CertificateRevocationList, certIds: string[]): void {
    if (!crl.thisUpdate || !crl.nextUpdate) {
      throw new TeeQuoteValidatorError('Certificate revocation list has no update date field');
    }
    if (!this.checkValidDate(crl.thisUpdate.value.valueOf(), crl.nextUpdate.value.valueOf())) {
      throw new TeeQuoteValidatorError('Certificate revocation list has invalid update date');
    }
    if (crl.revokedCertificates) {
      const isAnyRevoked = crl.revokedCertificates.find((revoked) =>
        certIds.includes(
          Buffer.from(revoked.userCertificate.valueBlock.valueHexView).toString('hex'),
        ),
      );
      if (isAnyRevoked) {
        throw new TeeQuoteValidatorError('Certificate in revokation list');
      }
    }
  }

  private async getCertificates(
    quote: TeeQuoteBase,
  ): Promise<{ pckCert: Certificate; rootCertPem: string }> {
    const platformCrlResult = await axios.get(`${this.baseUrl}/pckcrl?ca=platform&encoding=pem`);
    const platformChain = decodeURIComponent(platformCrlResult.headers['sgx-pck-crl-issuer-chain']);
    const [platformFetchedPem, rootFetchedPem] = this.splitChain(platformChain); // [platform, root]
    const platformFetchedCert = Certificate.fromPEM(Buffer.from(platformFetchedPem));
    const rootFetchedCert = Certificate.fromPEM(Buffer.from(rootFetchedPem));

    if (
      !this.checkValidDate(
        platformFetchedCert.validFrom.valueOf(),
        platformFetchedCert.validTo.valueOf(),
      )
    ) {
      throw new TeeQuoteValidatorError('Platform certificate validation date is not valid');
    }
    if (
      !this.checkValidDate(rootFetchedCert.validFrom.valueOf(), rootFetchedCert.validTo.valueOf())
    ) {
      throw new TeeQuoteValidatorError('Root certificate validation date is not valid');
    }
    if (!_.isEqual(rootFetchedCert.issuer, rootFetchedCert.subject)) {
      throw new TeeQuoteValidatorError('Root certificate is not self-signed');
    }
    if (Buffer.compare(rootFetchedCert.publicKey.keyRaw, INTEL_ROOT_PUB_KEY) !== 0) {
      throw new TeeQuoteValidatorError('Wrong Intel root certificate public key');
    }

    const pckCert = Certificate.fromPEM(Buffer.from(quote.certificates.device.pem));
    const certType = quote.qeCertificationDataType;

    if (!this.checkValidDate(pckCert.validFrom.valueOf(), pckCert.validTo.valueOf())) {
      throw new TeeQuoteValidatorError('PCK certificate validation date is not valid');
    }
    if (certType !== 5) {
      throw new TeeQuoteValidatorError(`Unsupported certification data type: ${certType}`);
    }
    if (rootFetchedPem !== quote.certificates.root.pem) {
      throw new TeeQuoteValidatorError("Invalid SGX root certificate in quote's certificate chain");
    }

    if (!this.checkChainForIssuers(pckCert, platformFetchedCert, rootFetchedCert)) {
      throw new TeeQuoteValidatorError('Invalid issuers in certificates chain');
    }

    const certIds = [
      rootFetchedCert.serialNumber,
      platformFetchedCert.serialNumber,
      pckCert.serialNumber,
    ];

    const caCrlUrl = this.isDefault
      ? INTEL_SGX_ROOT_CA_URL
      : `${this.baseUrl}/crl?uri=${INTEL_SGX_ROOT_CA_URL}`;
    const intelCrlDer = await axios.get(caCrlUrl, {
      responseType: 'arraybuffer',
    });
    const intelCrlAsn = fromBER(Buffer.from(intelCrlDer.data));
    this.checkCertificatesInCrl(
      new CertificateRevocationList({ schema: intelCrlAsn.result }),
      certIds,
    );

    const platformCrl = this.getCrl(platformCrlResult.data);
    this.checkCertificatesInCrl(platformCrl, certIds);

    return { pckCert, rootCertPem: rootFetchedPem };
  }

  private async verifyQeReportSignature(
    quote: TeeQuoteBase,
    pckPublicKey: Buffer,
  ): Promise<boolean> {
    const signature = Buffer.from(quote.qeReportSignature);
    const reportHash = await this.getSha256Hash(Buffer.from(quote.qeReport));

    return this.verifyDataBySignature(reportHash, signature, pckPublicKey);
  }

  private async verifyQeReportData(
    quote: TeeQuoteBase,
    report: TeeSgxReportDataType,
  ): Promise<boolean> {
    const qeAuthData = quote.qeAuthenticationData;
    const attestationKey = quote.ecdsaAttestationKey;
    const qeReportDataHash = report.dataHash;
    const calculatedHash = await this.getSha256Hash(Buffer.concat([attestationKey, qeAuthData]));
    const result = Buffer.compare(qeReportDataHash, calculatedHash);

    return result === 0;
  }

  private async verifyEnclaveReportSignature(quote: TeeQuoteBase): Promise<boolean> {
    const key = Buffer.from(quote.ecdsaAttestationKey);
    const headerBuffer = Buffer.from(quote.rawHeader);
    const reportBuffer =
      quote.quoteType === QuoteType.SGX
        ? Buffer.from((quote as TeeSgxQuoteDataType).report)
        : Buffer.from((quote as TeeTdxQuoteDataType).tdQuoteBody);
    const expected =
      quote.quoteType === QuoteType.SGX
        ? Buffer.from((quote as TeeSgxQuoteDataType).isvEnclaveReportSignature)
        : Buffer.from((quote as TeeTdxQuoteDataType).quoteSignature);

    const calculatedHash = await this.getSha256Hash(Buffer.concat([headerBuffer, reportBuffer]));

    const ellipticEc = new ec('p256');

    return ellipticEc.verify(
      calculatedHash,
      {
        r: expected.subarray(0, 32),
        s: expected.subarray(32),
      },
      Buffer.concat([Buffer.from([4]), key]),
    );
  }

  private async validateQuoteStructure(
    quote: TeeQuoteBase,
    report: TeeSgxReportDataType,
    pckPublicKey: Buffer,
  ): Promise<void> {
    if (!(await this.verifyQeReportSignature(quote, pckPublicKey))) {
      throw new TeeQuoteValidatorError('Wrong QE report signature');
    }
    if (!(await this.verifyQeReportData(quote, report))) {
      throw new TeeQuoteValidatorError('Wrong QE report data');
    }
    if (!(await this.verifyEnclaveReportSignature(quote))) {
      throw new TeeQuoteValidatorError('Wrong enclave report signature');
    }
  }

  private getSgxExtensionData(pckCert: Certificate): Extension {
    const sgxExtensionData = pckCert.extensions.find((item) => item.oid === SGX_OID);
    if (!sgxExtensionData) {
      throw new TeeQuoteValidatorError('SGX data not found in PCK certificate');
    }

    return sgxExtensionData;
  }

  private getDataFromExtension(
    sgxExtensionData: Extension,
    targetOid: string,
    targetType: forge.asn1.Type,
  ): string {
    const rawData = this.findSequenceByOID(sgxExtensionData.value.toString('hex'), targetOid);
    if (!rawData) {
      throw new TeeQuoteValidatorError(`OID ${targetOid} not found in PCK certificate's SGX data`);
    }
    const data = (rawData.value as forge.asn1.Asn1[]).filter(
      (asnElement) => asnElement.type === targetType,
    );
    if (!data.length) {
      throw new TeeQuoteValidatorError(`Data on OID ${targetOid} of type ${targetType} not found`);
    }
    const result = util.bytesToHex(data[0].value as string);

    return targetType === asn1.Type.OCTETSTRING ? result : parseInt(result, 16).toString();
  }

  private async getTcbInfo(
    fmspc: string,
    rootCertPem: string,
    quoteType: QuoteType,
  ): Promise<ITcbData> {
    let tcbUrl = `${this.baseUrl}/tcb?fmspc=${fmspc}`;
    if (quoteType === QuoteType.TDX) {
      tcbUrl = tcbUrl.replace('sgx/certification', 'tdx/certification');
    }
    const tcbData = await axios.get(tcbUrl);
    const tcbInfoHeader = 'tcb-info-issuer-chain';
    const tcbInfoChain = this.splitChain(decodeURIComponent(tcbData.headers[tcbInfoHeader])); // [tcb, root]
    if (tcbInfoChain[1] !== rootCertPem) {
      throw new TeeQuoteValidatorError('Invalid SGX root certificate in TCB chain');
    }

    const tcbCert = Certificate.fromPEM(Buffer.from(tcbInfoChain[0]));
    const key = tcbCert.publicKey.keyRaw;
    const signature = Buffer.from(tcbData.data.signature, 'hex');
    const calculatedhash = await this.getSha256Hash(
      Buffer.from(JSON.stringify(tcbData.data.tcbInfo)),
    );

    const result = this.verifyDataBySignature(calculatedhash, signature, key);
    if (!result) {
      throw new TeeQuoteValidatorError('TCB info signature is not valid');
    }

    if (tcbData.data.tcbInfo.nextUpdate.valueOf() > Date.now()) {
      throw new TeeQuoteValidatorError('TCB next update date is out of date');
    }

    return tcbData.data as ITcbData;
  }

  private async getQEIdentity(rootCertPem: string, quoteType: QuoteType): Promise<IQEIdentity> {
    let qeIdentityUrl = `${this.baseUrl}/qe/identity`;
    if (quoteType === QuoteType.TDX) {
      qeIdentityUrl = qeIdentityUrl.replace('sgx/certification', 'tdx/certification');
    }
    const qeIdentityData = await axios.get(qeIdentityUrl);
    const qeIdentityHeader = 'sgx-enclave-identity-issuer-chain';
    const qeIdentityChain = this.splitChain(
      decodeURIComponent(qeIdentityData.headers[qeIdentityHeader]),
    ); // [qeIdentity, root]
    if (qeIdentityChain[1] !== rootCertPem) {
      throw new TeeQuoteValidatorError('Invalid SGX root certificate in enclave identity chain');
    }

    const qeIdentityCert = Certificate.fromPEM(Buffer.from(qeIdentityChain[0]));
    const key = qeIdentityCert.publicKey.keyRaw;
    const signature = Buffer.from(qeIdentityData.data.signature, 'hex');
    const calculatedhash = await this.getSha256Hash(
      Buffer.from(JSON.stringify(qeIdentityData.data.enclaveIdentity)),
    );

    const result = this.verifyDataBySignature(calculatedhash, signature, key);
    if (!result) {
      throw new TeeQuoteValidatorError('Enclave identity signature is not valid');
    }

    if (qeIdentityData.data.enclaveIdentity.nextUpdate.valueOf() > Date.now()) {
      throw new TeeQuoteValidatorError('Enclave identity next update date is out of date');
    }

    return qeIdentityData.data as IQEIdentity;
  }

  private getQEIdentityStatus(
    report: TeeSgxReportDataType,
    qeIdentity: IQEIdentity,
  ): QEIdentityStatuses {
    const mrSigner = report.mrSigner.toString('hex');
    if (mrSigner.toUpperCase() !== qeIdentity.enclaveIdentity.mrsigner) {
      throw new TeeQuoteValidatorError('Wrong MR signer in QE report');
    }
    if (report.isvProdId !== qeIdentity.enclaveIdentity.isvprodid) {
      throw new TeeQuoteValidatorError('Wrong ISV PROD ID in QE report');
    }
    const tcbLevel = qeIdentity.enclaveIdentity.tcbLevels.find(
      (tcbLevel) => tcbLevel.tcb.isvsvn <= report.isvSvn,
    );

    const status = tcbLevel?.tcbStatus as QEIdentityStatuses;
    if (status) {
      this.logger.info(`Enclave identity status is ${tcbLevel?.tcbStatus}`);
      return status;
    }
    return QEIdentityStatuses.OutOfDate;
  }

  private getTcbStatus(
    fmspc: string,
    pceId: string,
    tcbData: ITcbData,
    sgxExtensionData: Extension,
  ): TCBStatuses {
    if (fmspc.toUpperCase() !== tcbData.tcbInfo.fmspc.toUpperCase()) {
      throw new TeeQuoteValidatorError('Wrong FMSPC in PCK certificate');
    }
    if (pceId !== tcbData.tcbInfo.pceId) {
      throw new TeeQuoteValidatorError('Wrong PCEID in PCK certificate');
    }

    const pceSvn = this.getDataFromExtension(sgxExtensionData, PCESVN_OID, asn1.Type.INTEGER);
    const sgxComponents = [...Array(16).keys()].map((i) =>
      this.getDataFromExtension(sgxExtensionData, `${TCB_OID}.${i + 1}`, asn1.Type.INTEGER),
    );
    const tcbLevel = tcbData.tcbInfo.tcbLevels.find(
      (tcbLevel) =>
        tcbLevel.tcb.pcesvn <= Number(pceSvn) &&
        tcbLevel.tcb.sgxtcbcomponents.every((el, index) => el.svn <= Number(sgxComponents[index])),
    );

    const status = tcbLevel?.tcbStatus as TCBStatuses;
    if (status) {
      this.logger.info(`TCB status is ${tcbLevel?.tcbStatus}`);
      return status;
    }
    return TCBStatuses.OutOfDate;
  }

  private getQuoteValidationStatus(
    qeIdentityStatus: QEIdentityStatuses,
    tcbStatus: TCBStatuses,
  ): QuoteValidationStatuses {
    if (qeIdentityStatus === QEIdentityStatuses.OutOfDate) {
      if (tcbStatus === TCBStatuses.UpToDate || tcbStatus === TCBStatuses.SWHardeningNeeded) {
        return QuoteValidationStatuses.SecurityPatchNeeded;
      }
      if (
        tcbStatus === TCBStatuses.OutOfDateConfigurationNeeded ||
        tcbStatus === TCBStatuses.ConfigurationAndSWHardeningNeeded
      ) {
        return QuoteValidationStatuses.SoftwareUpdateNeeded;
      }
    }
    if (qeIdentityStatus === QEIdentityStatuses.Revoked || tcbStatus === TCBStatuses.Revoked) {
      throw new TeeQuoteValidatorError('QE identity or TCB revoked');
    }
    if (tcbStatus === TCBStatuses.UpToDate) {
      return QuoteValidationStatuses.UpToDate;
    }
    if (tcbStatus === TCBStatuses.OutOfDate) {
      return QuoteValidationStatuses.SecurityPatchNeeded;
    }
    if (tcbStatus === TCBStatuses.ConfigurationNeeded) {
      return QuoteValidationStatuses.ConfigurationNeeded;
    }
    return QuoteValidationStatuses.SoftwareUpdateNeeded;
  }

  private getQuoteValidationStatusDescription(status: QuoteValidationStatuses): string {
    switch (status) {
      case QuoteValidationStatuses.UpToDate:
        return 'The Quote verification passed and is at the latest TCB level.';
      case QuoteValidationStatuses.ConfigurationNeeded:
        return `The SGX platform firmware and SW are at the latest security patching level
                    but there are platform hardware configurations may expose the enclave to vulnerabilities.`;
      case QuoteValidationStatuses.SecurityPatchNeeded:
        return `The SGX platform firmware and SW are not at the latest security patching level.
                    The platform needs to be patched with firmware and/or software patches.`;
      case QuoteValidationStatuses.SoftwareUpdateNeeded:
        return `The SGX platform firmware and SW are at the latest security patching level but there are
                    certain vulnerabilities that can only be mitigated with software mitigations implemented by the enclave.`;
      default:
        return 'Quote verification failed.';
    }
  }

  public async validate(quoteBuffer: Buffer): Promise<ValidationResult> {
    try {
      const quoteType = TeeParser.determineQuoteType(quoteBuffer);
      const quote =
        quoteType.type === QuoteType.SGX
          ? this.teeSgxParser.parseQuote(quoteBuffer)
          : this.teeTdxParser.parseQuote(quoteBuffer);
      const report = this.teeSgxParser.parseReport(quote.qeReport);

      const { pckCert, rootCertPem } = await this.getCertificates(quote);

      await this.validateQuoteStructure(quote, report, pckCert.publicKey.keyRaw);
      this.logger.info('Quote structure validated successfully');

      const sgxExtensionData = this.getSgxExtensionData(pckCert);
      const fmspc = this.getDataFromExtension(sgxExtensionData, FMSPC_OID, asn1.Type.OCTETSTRING);
      const pceId = this.getDataFromExtension(sgxExtensionData, PCEID_OID, asn1.Type.OCTETSTRING);

      const tcbData = await this.getTcbInfo(fmspc, rootCertPem, quoteType.type);
      const qeIdentity = await this.getQEIdentity(rootCertPem, quoteType.type);

      const qeIdentityStatus = this.getQEIdentityStatus(report, qeIdentity);
      const tcbStatus = this.getTcbStatus(fmspc, pceId, tcbData, sgxExtensionData);

      const quoteValidationStatus = this.getQuoteValidationStatus(qeIdentityStatus, tcbStatus);
      this.logger.info(`Quote validation status is ${quoteValidationStatus}`);

      return {
        quoteValidationStatus,
        description: this.getQuoteValidationStatusDescription(quoteValidationStatus),
      };
    } catch (error) {
      this.logger.error(`Validation error: ${error}`);

      return {
        quoteValidationStatus: QuoteValidationStatuses.Error,
        description: this.getQuoteValidationStatusDescription(QuoteValidationStatuses.Error),
        error,
      };
    }
  }

  public async isQuoteHasUserData(quoteBuffer: Buffer, userDataBuffer: Buffer): Promise<boolean> {
    const quoteType = TeeParser.determineQuoteType(quoteBuffer);
    const quote =
      quoteType.type === QuoteType.SGX
        ? this.teeSgxParser.parseQuote(quoteBuffer)
        : this.teeTdxParser.parseQuote(quoteBuffer);

    let slicedQuoteData: Uint8Array | Buffer;
    const userDataHash = await this.getSha256Hash(userDataBuffer);
    if (quoteType.type === QuoteType.SGX) {
      slicedQuoteData = this.teeSgxParser
        .parseReport((quote as TeeSgxQuoteDataType).report)
        .userData.slice(0, userDataHash.length);
    } else {
      slicedQuoteData = this.teeTdxParser
        .parseBody((quote as TeeTdxQuoteDataType).tdQuoteBody)
        .reportData.slice(0, userDataHash.length);
    }

    const compareResult = Buffer.compare(slicedQuoteData, userDataHash);

    return compareResult === 0;
  }

  private async getSha256Hash(data: Buffer): Promise<Buffer> {
    const hashInfo = {
      algo: HashAlgorithm.SHA256,
      encoding: Encoding.base64,
    };
    const hashData = await Crypto.createHash(data, hashInfo);
    return Buffer.from(hashData.hash, hashData.encoding);
  }
}
