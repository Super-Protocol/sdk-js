import axios from 'axios';
import { createHash } from 'crypto';
import { ec } from 'elliptic';
import { util, asn1 } from 'node-forge';
import { Certificate, Extension } from '@fidm/x509';
import { TeeSgxParser } from './QuoteParser';
import { TeeSgxQuoteDataType, TeeSgxReportDataType } from './types';
import rootLogger from '../logger';
import { IQEIdentity, ITcbData } from './interface';
import { TeeQuoteValidatorError } from './errors';
import { QEIdentityStatuses, TCBStatuses, QuoteValidationStatuses } from './statuses';

const BASE_SGX_URL = 'https://api.trustedservices.intel.com/sgx/certification/v4';
const SGX_OID = '1.2.840.113741.1.13.1';
const FMSPC_OID = `${SGX_OID}.4`;
const PCEID_OID = `${SGX_OID}.3`;
const TCB_OID = `${SGX_OID}.2`;
const PCESVN_OID = `${TCB_OID}.17`;

interface ValidationResult {
    quoteValidationStatus: QuoteValidationStatuses;
    description: string;
    error?: unknown;
}

export class QuoteValidator {
    private readonly teeSgxParser: TeeSgxParser;
    private logger: typeof rootLogger;

    constructor() {
        this.teeSgxParser = new TeeSgxParser();
        this.logger = rootLogger.child({ className: QuoteValidator.name });
    }

    private splitChain(chain: string): string[] {
        const begin = '-----BEGIN CERTIFICATE-----';
        const end = '-----END CERTIFICATE-----';

        return chain
            .split(begin)
            .filter(Boolean)
            .map((cert) => begin.concat(cert.slice(0, cert.indexOf(end)), end));
    }

    private findSequenceByOID(hexValue: string, targetOID: string): asn1.Asn1 | null {
        const buffer = util.hexToBytes(hexValue);
        const asn1Data = asn1.fromDer(buffer);

        return this.searchForSequence(asn1Data, targetOID);
    }

    private searchForSequence(asn1Data: asn1.Asn1, targetOID: string): asn1.Asn1 | null {
        if (asn1Data.type === asn1.Type.SEQUENCE) {
            for (const child of asn1Data.value as asn1.Asn1[]) {
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

    private async fetchSgxRootCertificate(): Promise<string> {
        const platformCrlResult = await axios.get(
            `${BASE_SGX_URL}/pckcrl?ca=platform&encoding=pem`,
        );
        const platformChain = decodeURIComponent(
            platformCrlResult.headers['sgx-pck-crl-issuer-chain'],
        );
        const [, fetchedRootCert] = this.splitChain(platformChain);

        return fetchedRootCert;
    }

    private getAndCheckPckCertificate(quote: TeeSgxQuoteDataType, rootCert: string): Certificate {
        const certificatePems: string[] = this.splitChain(quote.qeCertificationData.toString()); // [pck, platform, root]
        const pckCert = Certificate.fromPEM(Buffer.from(certificatePems[0]));
        const certType = quote.qeCertificationDataType;

        if (certType !== 5) {
            throw new TeeQuoteValidatorError(`Unsupported certification data type: ${certType}`);
        }
        if (pckCert.validTo.valueOf() < Date.now()) {
            throw new TeeQuoteValidatorError('PCK certificate expired');
        }
        if (rootCert !== certificatePems[2]) {
            throw new TeeQuoteValidatorError(
                "Invalid SGX root certificate in quote's certificate chain",
            );
        }

        return pckCert;
    }

    private verifyQeReportSignature(quote: TeeSgxQuoteDataType, pckPublicKey: Buffer): boolean {
        const signature = quote.qeReportSignature;
        const hash = createHash('sha256');
        hash.update(Buffer.from(quote.qeReport));
        const ellipticEc = new ec('p256');
        const result = ellipticEc.verify(
            hash.digest(),
            {
                r: signature.subarray(0, 32),
                s: signature.subarray(32),
            },
            ellipticEc.keyFromPublic(pckPublicKey, 'hex'),
        );

        return result;
    }

    private verifyQeReportData(quote: TeeSgxQuoteDataType, report: TeeSgxReportDataType): boolean {
        const qeAuthData = quote.qeAuthenticationData;
        const attestationKey = quote.ecdsaAttestationKey;
        const qeReportDataHash = report.dataHash;
        const hash = createHash('sha256');
        const hashResult = hash.update(Buffer.concat([attestationKey, qeAuthData])).digest();
        const result = Buffer.compare(qeReportDataHash, hashResult);

        return result === 0;
    }

    private verifyEnclaveReportSignature(quote: TeeSgxQuoteDataType): boolean {
        const key = Buffer.from(quote.ecdsaAttestationKey);
        const headerBuffer = Buffer.from(quote.rawHeader);
        const reportBuffer = Buffer.from(quote.report);
        const expected = quote.isvEnclaveReportSignature;

        const hash = createHash('sha256');
        hash.update(Buffer.concat([headerBuffer, reportBuffer]));
        const ellipticEc = new ec('p256');
        const result = ellipticEc.verify(
            hash.digest(),
            {
                r: expected.subarray(0, 32),
                s: expected.subarray(32),
            },
            Buffer.concat([Buffer.from([4]), key]),
        );

        return result;
    }

    private async validateQuoteStructure(
        quote: TeeSgxQuoteDataType,
        report: TeeSgxReportDataType,
        pckPublicKey: Buffer,
    ): Promise<void> {
        if (!(await this.verifyQeReportSignature(quote, pckPublicKey))) {
            throw new TeeQuoteValidatorError('Wrong QE report signature');
        }
        if (!this.verifyQeReportData(quote, report)) {
            throw new TeeQuoteValidatorError('Wrong QE report data');
        }
        if (!this.verifyEnclaveReportSignature(quote)) {
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
        targetType: asn1.Type,
    ): string {
        const rawData = this.findSequenceByOID(sgxExtensionData.value.toString('hex'), targetOid);
        if (!rawData) {
            throw new TeeQuoteValidatorError(
                `OID ${targetOid} not found in PCK certificate's SGX data`,
            );
        }
        const data = (rawData.value as asn1.Asn1[]).filter(
            (asnElement) => asnElement.type === targetType,
        );
        if (!data.length) {
            throw new TeeQuoteValidatorError(
                `Data on OID ${targetOid} of type ${targetType} not found`,
            );
        }
        const result = util.bytesToHex(data[0].value as string);

        return targetType === asn1.Type.OCTETSTRING ? result : parseInt(result, 16).toString();
    }

    private async getTcbInfo(fmspc: string, rootCert: string): Promise<ITcbData> {
        const tcbData = await axios.get(`${BASE_SGX_URL}/tcb?fmspc=${fmspc}`);
        const tcbInfoHeader = 'tcb-info-issuer-chain';
        const tcbInfoChain = this.splitChain(decodeURIComponent(tcbData.headers[tcbInfoHeader])); // [tcb, root]

        if (tcbInfoChain[1] !== rootCert) {
            throw new TeeQuoteValidatorError('Invalid SGX root certificate in TCB chain');
        }

        return tcbData.data;
    }

    private async getQEIdentity(rootCert: string): Promise<IQEIdentity> {
        const qeIdentityData = await axios.get(`${BASE_SGX_URL}/qe/identity`);
        const qeIdentityHeader = 'sgx-enclave-identity-issuer-chain';
        const qeIdentityChain = this.splitChain(
            decodeURIComponent(qeIdentityData.headers[qeIdentityHeader]),
        ); // [qeIdentity, root]

        if (qeIdentityChain[1] !== rootCert) {
            throw new TeeQuoteValidatorError('Invalid SGX root certificate in QE Identity chain');
        }

        return qeIdentityData.data;
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

        this.logger.info(`QE identity status is ${tcbLevel?.tcbStatus}`);
        switch (tcbLevel?.tcbStatus) {
            case QEIdentityStatuses.UpToDate:
                return QEIdentityStatuses.UpToDate;
            case QEIdentityStatuses.OutOfDate:
                return QEIdentityStatuses.OutOfDate;
            case QEIdentityStatuses.Revoked:
                return QEIdentityStatuses.Revoked;

            default:
                throw new TeeQuoteValidatorError('Unknown QE identity status');
        }
    }

    private getTcbStatus(
        fmspc: string,
        pceId: string,
        tcbData: ITcbData,
        sgxExtensionData: Extension,
    ): TCBStatuses {
        if (fmspc !== tcbData.tcbInfo.fmspc) {
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
                tcbLevel.tcb.sgxtcbcomponents.every(
                    (el, index) => el.svn <= Number(sgxComponents[index]),
                ),
        );

        const status = tcbLevel?.tcbStatus as TCBStatuses;
        if (status) {
            this.logger.info(`TCB status is ${tcbLevel?.tcbStatus}`);
            return status;
        }
        throw new TeeQuoteValidatorError('Unknown TBC status');
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
            case QuoteValidationStatuses.Error:
                return 'Quote verification failed.';
            default:
                return 'Unknown status';
        }
    }

    public async validate(quoteBuffer: Buffer): Promise<ValidationResult> {
        try {
            const quote: TeeSgxQuoteDataType = this.teeSgxParser.parseQuote(quoteBuffer);
            const report: TeeSgxReportDataType = this.teeSgxParser.parseReport(quote.qeReport);

            const rootCert = await this.fetchSgxRootCertificate();
            const pckCert = this.getAndCheckPckCertificate(quote, rootCert);

            await this.validateQuoteStructure(quote, report, pckCert.publicKey.keyRaw);
            this.logger.info('Quote structure validated successfully');

            const sgxExtensionData = this.getSgxExtensionData(pckCert);
            const fmspc = this.getDataFromExtension(
                sgxExtensionData,
                FMSPC_OID,
                asn1.Type.OCTETSTRING,
            );
            const pceId = this.getDataFromExtension(
                sgxExtensionData,
                PCEID_OID,
                asn1.Type.OCTETSTRING,
            );

            const tcbData = await this.getTcbInfo(fmspc, rootCert);
            const qeIdentity = await this.getQEIdentity(rootCert);

            const qeIdentityStatus = this.getQEIdentityStatus(report, qeIdentity);
            const tcbStatus = this.getTcbStatus(fmspc, pceId, tcbData, sgxExtensionData);

            const quoteValidationStatus = this.getQuoteValidationStatus(
                qeIdentityStatus,
                tcbStatus,
            );
            this.logger.info(`Quote validation status is ${quoteValidationStatus}`);

            return {
                quoteValidationStatus,
                description: this.getQuoteValidationStatusDescription(quoteValidationStatus),
            };
        } catch (error) {
            this.logger.error(`Validation error: ${error}`);

            return {
                quoteValidationStatus: QuoteValidationStatuses.Error,
                description: this.getQuoteValidationStatusDescription(
                    QuoteValidationStatuses.Error,
                ),
                error,
            };
        }
    }
}
