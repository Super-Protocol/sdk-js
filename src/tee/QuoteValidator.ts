import axios from "axios";
import { createHash } from "crypto";
import { ec } from "elliptic";
import { util, asn1 } from "node-forge";
import { Certificate, Extension } from "@fidm/x509";
import { TeeSgxParser } from "./QuoteParser";
import { TeeSgxQuoteDataType, TeeSgxReportDataType } from "./types";
import rootLogger from "../logger";
import { IQEIdentity, ITCBInfo } from "./interface";
import { TeeQuoteValidatorError } from "./errors";

const BASE_SGX_URL = "https://api.trustedservices.intel.com/sgx/certification/v";
const SGX_OID = "1.2.840.113741.1.13.1";
const FMSPC_OID = `${SGX_OID}.4`;
const PCEID_OID = `${SGX_OID}.3`;

export class QuoteValidator {
    private readonly teeSgxParser: TeeSgxParser;
    private sgxUrlVersioned = "";
    private logger: typeof rootLogger;

    constructor() {
        this.teeSgxParser = new TeeSgxParser();
        this.logger = rootLogger.child({ className: QuoteValidator.name });
    }

    private splitChain(chain: string): string[] {
        return chain
            .split("-----BEGIN CERTIFICATE-----")
            .filter((cert) => cert)
            .map((cert) => `-----BEGIN CERTIFICATE-----` + cert);
    }

    private findSequenceByOID(hexValue: string, targetOID: string) {
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
        const platformCrlResult = await axios.get(`${this.sgxUrlVersioned}/pckcrl?ca=platform&encoding=pem`);
        const platformChain = decodeURIComponent(platformCrlResult.headers["sgx-pck-crl-issuer-chain"]);
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
            throw new TeeQuoteValidatorError("PCK certificate expired");
        }
        if (rootCert !== certificatePems[2]) {
            throw new TeeQuoteValidatorError("Invalid SGX root certificate in quote's certificate chain");
        }

        return pckCert;
    }

    private async verifyQeReportSignature(quote: TeeSgxQuoteDataType, pckPublicKey: Buffer): Promise<boolean> {
        const signature = quote.qeReportSignature;
        const hash = createHash("sha256");
        hash.update(Buffer.from(quote.qeReport));
        const ellipticEc = new ec("p256");
        const result = ellipticEc.verify(
            hash.digest(),
            {
                r: signature.subarray(0, 32),
                s: signature.subarray(32),
            },
            ellipticEc.keyFromPublic(pckPublicKey, "hex"),
        );

        return result;
    }

    private verifyQeReportData(quote: TeeSgxQuoteDataType, report: TeeSgxReportDataType): boolean {
        const qeAuthData = quote.qeAuthenticationData;
        const attestationKey = quote.ecdsaAttestationKey;
        const qeReportDataHash = report.dataHash;
        const hash = createHash("sha256");
        const hashResult = hash.update(Buffer.concat([attestationKey, qeAuthData])).digest();
        const result = Buffer.compare(qeReportDataHash, hashResult);

        return result === 0;
    }

    private verifyEnclaveReportSignature(quote: TeeSgxQuoteDataType): boolean {
        const key = Buffer.from(quote.ecdsaAttestationKey);
        const headerBuffer = Buffer.from(quote.rawHeader);
        const reportBuffer = Buffer.from(quote.report);
        const expected = quote.isvEnclaveReportSignature;

        const hash = createHash("sha256");
        hash.update(Buffer.concat([headerBuffer, reportBuffer]));
        const ellipticEc = new ec("p256");
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
            throw new TeeQuoteValidatorError("Wrong QE report signature");
        }
        if (!this.verifyQeReportData(quote, report)) {
            throw new TeeQuoteValidatorError("Wrong QE report data");
        }
        if (!this.verifyEnclaveReportSignature(quote)) {
            throw new TeeQuoteValidatorError("Wrong enclave report signature");
        }
    }

    private getSgxExtensionData(pckCert: Certificate): Extension {
        const sgxExtensionData = pckCert.extensions.find((item) => item.oid === SGX_OID);
        if (!sgxExtensionData) {
            throw new TeeQuoteValidatorError("SGX data not found in PCK certificate");
        }

        return sgxExtensionData;
    }

    private getFmspc(sgxExtensionData: Extension): string {
        const fmspcRawData = this.findSequenceByOID(sgxExtensionData.value.toString("hex"), FMSPC_OID);
        if (!fmspcRawData) {
            throw new TeeQuoteValidatorError("FMSPC not found in PCK certificate");
        }
        const fmspcRaw = (fmspcRawData.value as asn1.Asn1[]).filter(
            (asnElement) => asnElement.type === asn1.Type.OCTETSTRING,
        );
        const fmspc = util.bytesToHex(fmspcRaw[0].value as string);

        return fmspc;
    }

    private getPceId(sgxExtensionData: Extension): string {
        const pceIdData = this.findSequenceByOID(sgxExtensionData.value.toString("hex"), PCEID_OID);
        if (!pceIdData) {
            throw new TeeQuoteValidatorError("PCEID not found in PCK certificate");
        }
        const pceIdRaw = (pceIdData.value as asn1.Asn1[]).filter(
            (asnElement) => asnElement.type === asn1.Type.OCTETSTRING,
        );
        const pceId = util.bytesToHex(pceIdRaw[0].value as string);

        return pceId;
    }

    private async getTcbInfo(version: number, fmspc: string, rootCert: string): Promise<ITCBInfo> {
        const tcbData = await axios.get(`${this.sgxUrlVersioned}/tcb?fmspc=${fmspc}`);
        const tcbInfoHeader = version > 3 ? "tcb-info-issuer-chain" : "sgx-tcb-info-issuer-chain";
        const tcbInfoChain = this.splitChain(decodeURIComponent(tcbData.headers[tcbInfoHeader])); // [tcb, root]

        if (tcbInfoChain[1] !== rootCert) {
            throw new TeeQuoteValidatorError("Wrong root certificate in TCB chain");
        }

        return tcbData.data;
    }

    private async getQEIdentity(rootCert: string): Promise<IQEIdentity> {
        const qeIdentityData = await axios.get(`${this.sgxUrlVersioned}/qe/identity`);
        const qeIdentityHeader = "sgx-enclave-identity-issuer-chain";
        const qeIdentityChain = this.splitChain(decodeURIComponent(qeIdentityData.headers[qeIdentityHeader])); // [qeIdentity, root]

        if (qeIdentityChain[1] !== rootCert) {
            throw new TeeQuoteValidatorError("Wrong root certificate in QE Identity chain");
        }

        return qeIdentityData.data;
    }

    private checkQEIdentity(report: TeeSgxReportDataType, qeIdentity: IQEIdentity): void {
        const mrSigner = report.mrSigner.toString("hex");
        if (mrSigner.toUpperCase() !== qeIdentity.enclaveIdentity.mrsigner) {
            throw new TeeQuoteValidatorError("Wrong MR signer in QE report");
        }
        // TODO
        this.logger.warn(
            `Parsing quote's field QEReport.ISVProdID not supported.
            Should be equal ${qeIdentity.enclaveIdentity.isvprodid}`,
        );
        // TODO
        this.logger.warn(
            `Parsing quote's field QEReport.ISVSVN not supported.
            Should get status from TCBLevel.tcbStatus of ${qeIdentity.enclaveIdentity.tcbLevels}
            with max TCBLevel.tcb.isvsvn <= QEReport.ISVSVN.
            Throw if status is not UpToDate`,
        );
    }

    private checkTcbInfo(fmspc: string, pceId: string, tcbInfo: ITCBInfo): void {
        if (fmspc !== tcbInfo.tcbInfo.fmspc) {
            throw new TeeQuoteValidatorError("Wrong FMSPC in PCK certificate");
        }
        if (pceId !== tcbInfo.tcbInfo.pceId) {
            throw new TeeQuoteValidatorError("Wrong PCEID in PCK certificate");
        }
        // TODO
        this.logger.warn(
            `Parsing quote's field header.PCESVN not supported.
            header.PCESVN must be >= any of tcbInfo.tcbLevels[].tcb.pcesvn.
            Get tcbInfo.tcbLevels[].tcbStatus from max tcbInfo.tcbLevels[].tcb.pcesvn`,
        );
    }

    public async validate(quoteBuffer: Buffer): Promise<boolean> {
        try {
            const quote: TeeSgxQuoteDataType = this.teeSgxParser.parseQuote(quoteBuffer);
            const report: TeeSgxReportDataType = this.teeSgxParser.parseReport(quote.qeReport);
            this.sgxUrlVersioned = `${BASE_SGX_URL}${quote.header.version}`;

            const rootCert = await this.fetchSgxRootCertificate();
            const pckCert = this.getAndCheckPckCertificate(quote, rootCert);

            await this.validateQuoteStructure(quote, report, pckCert.publicKey.keyRaw);
            this.logger.info("Quote structure validated successfully");

            const sgxExtensionData = this.getSgxExtensionData(pckCert);
            const fmspc = this.getFmspc(sgxExtensionData);
            const pceId = this.getPceId(sgxExtensionData);
            const tcbInfo = await this.getTcbInfo(quote.header.version, fmspc, rootCert);
            const qeIdentity = await this.getQEIdentity(rootCert);

            this.checkQEIdentity(report, qeIdentity);
            this.checkTcbInfo(fmspc, pceId, tcbInfo);
            this.logger.info("Quote valid");

            return true;
        } catch (error) {
            this.logger.error(`Validation error: ${error}`);

            return false;
        }
    }
}
