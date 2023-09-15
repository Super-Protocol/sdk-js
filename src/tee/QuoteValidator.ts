import axios from "axios";
import crypto from "crypto";
import elliptic from "elliptic";
import { util, asn1 } from "node-forge";
import { Certificate } from "@fidm/x509";
import { TeeSgxParserV3, TeeSgxQuoteDataType, TeeSgxReportDataType } from "@super-protocol/tee-lib";
import rootLogger from "../logger";

const BASE_SGX_URL = "https://api.trustedservices.intel.com/sgx/certification/v";
// const cRLDistributionPointsOid = "2.5.29.31";
const SGX_OID = "1.2.840.113741.1.13.1";
const FMSPC_OID = `${SGX_OID}.4`;
const PCEID_OID = `${SGX_OID}.3`;

interface ISVSVNStatus {
    tcb: {
        isvsvn: number;
    };
    tcbDate: string;
    tcbStatus: string;
}

interface QEIdentity {
    signature: string;
    enclaveIdentity: {
        id: string;
        version: number;
        issueDate: string;
        nextUpdate: string;
        tcbEvaluationDataNumber: number;
        miscselect: string;
        miscselectMask: string;
        attributes: string;
        attributesMask: string;
        mrsigner: string;
        isvprodid: number;
        tcbLevels: [ISVSVNStatus];
    };
}

interface TCBSVNStatus {
    tcb: {
        sgxtcbcomp01svn: number;
        sgxtcbcomp02svn: number;
        sgxtcbcomp03svn: number;
        sgxtcbcomp04svn: number;
        sgxtcbcomp05svn: number;
        sgxtcbcomp06svn: number;
        sgxtcbcomp07svn: number;
        sgxtcbcomp08svn: number;
        sgxtcbcomp09svn: number;
        sgxtcbcomp10svn: number;
        sgxtcbcomp11svn: number;
        sgxtcbcomp12svn: number;
        sgxtcbcomp13svn: number;
        sgxtcbcomp14svn: number;
        sgxtcbcomp15svn: number;
        sgxtcbcomp16svn: number;
        pcesvn: number;
    };
    tcbDate: string;
    tcbStatus: string;
}

interface TCBInfo {
    signature: string;
    tcbInfo: {
        version: number;
        issueDate: string;
        nextUpdate: string;
        fmspc: string;
        pceId: string;
        tcbType: number;
        tcbEvaluationDataNumber: number;
        tcbLevels: [TCBSVNStatus];
    };
}

export class QuoteValidator {
    private readonly teeSgxParser: TeeSgxParserV3;
    private intelSgxRootCertificate = "";
    private logger: typeof rootLogger;

    constructor() {
        this.teeSgxParser = new TeeSgxParserV3();
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

    private async verifyQeReportSignature(quote: TeeSgxQuoteDataType): Promise<boolean> {
        const qeReport = quote.qeReport;
        const certChain = quote.qeCertificationData.toString();
        const certType = quote.qeCertificationDataType;
        if (certType !== 5) {
            throw new Error(`Unsupported certification data type: ${certType}`);
        }
        const signature = quote.qeReportSignature;

        const certificatePems: string[] = this.splitChain(certChain); // [pck, platform, root]
        const [pckCert, platformCert, rootCert] = certificatePems.map((certPem) =>
            Certificate.fromPEM(Buffer.from(certPem)),
        );

        // pck
        if (pckCert.validTo.valueOf() < Date.now()) {
            throw new Error("PCK certificate expired");
        }
        const publicKey = pckCert.publicKey;

        // platform
        const platformCrlResult = await axios.get(
            `${BASE_SGX_URL}${quote.header.version}/pckcrl?ca=platform&encoding=pem`,
        );
        // const platformCrl = platformCrlResult.data;
        const platformChain = decodeURIComponent(platformCrlResult.headers["sgx-pck-crl-issuer-chain"]);

        // root
        const [, fetchedRootCert] = this.splitChain(platformChain);
        this.intelSgxRootCertificate = fetchedRootCert;

        // const crlExtension = rootCert.extensions.find((item) => item.oid === cRLDistributionPointsOid);
        // if (!crlExtension) {
        //     throw new Error("CRL distribution points value not found in root certificate");
        // }
        // const rawRootCrlUrl = Buffer.from(crlExtension!.value).toString();
        // const rootCrlUrl = rawRootCrlUrl.slice(rawRootCrlUrl.indexOf("http"));
        // const rootCrlResult = await axios.get(rootCrlUrl, { responseType: "arraybuffer" });
        // const rootCrl = `-----BEGIN X509 CRL-----\n${rootCrlResult.data
        //     .toString("base64")
        //     .match(/.{0,64}/g)!
        //     .join("\n")}-----END X509 CRL-----`;

        // check root certificate
        if (fetchedRootCert !== certificatePems[2]) {
            throw new Error("Invalid SGX root certificate");
        }

        // check QE report signature
        const hash = crypto.createHash("sha256");
        hash.update(Buffer.from(qeReport));
        const ec = new elliptic.ec("p256");
        const result = ec.verify(
            hash.digest(),
            {
                r: signature.subarray(0, 32),
                s: signature.subarray(32),
            },
            ec.keyFromPublic(publicKey.keyRaw, "hex"),
        );

        return result;
    }

    private verifyQeReportData(quote: TeeSgxQuoteDataType, report: TeeSgxReportDataType): boolean {
        const qeAuthData = quote.qeAuthenticationData;
        const attestationKey = quote.ecdsaAttestationKey;
        const qeReportDataHash = report.dataHash;
        const hash = crypto.createHash("sha256");
        const hashResult = hash.update(Buffer.concat([attestationKey, qeAuthData])).digest();
        const result = Buffer.compare(qeReportDataHash, hashResult);

        return result === 0;
    }

    private verifyEnclaveReportSignature(quote: TeeSgxQuoteDataType): boolean {
        const key = Buffer.from(quote.ecdsaAttestationKey);
        const headerBuffer = Buffer.from(quote.rawHeader);
        const reportBuffer = Buffer.from(quote.report);
        const expected = quote.isvEnclaveReportSignature;

        const hash = crypto.createHash("sha256");
        hash.update(Buffer.concat([headerBuffer, reportBuffer]));
        const ec = new elliptic.ec("p256");
        const result = ec.verify(
            hash.digest(),
            {
                r: expected.subarray(0, 32),
                s: expected.subarray(32),
            },
            Buffer.concat([Buffer.from([4]), key]),
        );

        return result;
    }

    private async validateQuoteStructure(quote: TeeSgxQuoteDataType, report: TeeSgxReportDataType): Promise<void> {
        if (!(await this.verifyQeReportSignature(quote))) {
            throw new Error("Wrong QE report signature");
        }
        if (!this.verifyQeReportData(quote, report)) {
            throw new Error("Wrong QE report data");
        }
        if (!this.verifyEnclaveReportSignature(quote)) {
            throw new Error("Wrong enclave report signature");
        }
    }

    private getFmspc(quote: TeeSgxQuoteDataType): string {
        const certificatePems: string[] = this.splitChain(quote.qeCertificationData.toString());
        const pckCert = Certificate.fromPEM(Buffer.from(certificatePems[0]));
        const sgxExtension = pckCert.extensions.find((item) => item.oid === SGX_OID);

        const parsedSgx = this.findSequenceByOID(sgxExtension!.value.toString("hex"), FMSPC_OID);
        if (!parsedSgx) {
            throw new Error("FMSPC not found in PCK certificate");
        }
        const fmspcRaw = (parsedSgx.value as asn1.Asn1[]).filter(
            (asnElement) => asnElement.type === asn1.Type.OCTETSTRING,
        );
        const fmspc = util.bytesToHex(fmspcRaw[0].value as string);

        return fmspc;
    }

    private getPceId(quote: TeeSgxQuoteDataType): string {
        const certificatePems: string[] = this.splitChain(quote.qeCertificationData.toString());
        const pckCert = Certificate.fromPEM(Buffer.from(certificatePems[0]));
        const sgxExtension = pckCert.extensions.find((item) => item.oid === SGX_OID);

        const parsedSgx = this.findSequenceByOID(sgxExtension!.value.toString("hex"), PCEID_OID);
        if (!parsedSgx) {
            throw new Error("PCEID not found in PCK certificate");
        }
        const pceIdRaw = (parsedSgx.value as asn1.Asn1[]).filter(
            (asnElement) => asnElement.type === asn1.Type.OCTETSTRING,
        );
        const pceId = util.bytesToHex(pceIdRaw[0].value as string);

        return pceId;
    }

    private async getTcbInfo(quote: TeeSgxQuoteDataType): Promise<TCBInfo> {
        const fmspc = this.getFmspc(quote);
        const tcbData = await axios.get(`${BASE_SGX_URL}${quote.header.version}/tcb?fmspc=${fmspc}`);
        const tcbInfoHeader = quote.header.version > 3 ? "tcb-info-issuer-chain" : "sgx-tcb-info-issuer-chain";
        const tcbInfoChain = this.splitChain(decodeURIComponent(tcbData.headers[tcbInfoHeader])); // [tcb, root]

        if (tcbInfoChain[1] !== this.intelSgxRootCertificate) {
            throw new Error("Wrong root certificate in TCB chain");
        }

        // howto: проверить целостность tcbInfo

        return tcbData.data;
    }

    private async getQEIdentity(quote: TeeSgxQuoteDataType): Promise<QEIdentity> {
        const qeIdentityData = await axios.get(`${BASE_SGX_URL}${quote.header.version}/qe/identity`);
        const qeIdentityHeader = "sgx-enclave-identity-issuer-chain";
        const qeIdentityChain = this.splitChain(decodeURIComponent(qeIdentityData.headers[qeIdentityHeader])); // [qeIdentity, root]

        if (qeIdentityChain[1] !== this.intelSgxRootCertificate) {
            throw new Error("Wrong root certificate in QE Identity chain");
        }

        // howto: проверить целостность enclaveIdentity

        return qeIdentityData.data;
    }

    private checkQEIdentity(report: TeeSgxReportDataType, qeIdentity: QEIdentity): void {
        const mrSigner = report.mrSigner.toString("hex");
        if (mrSigner.toUpperCase() !== qeIdentity.enclaveIdentity.mrsigner) {
            throw new Error("Wrong MR signer in QE report");
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

    private checkTcbInfo(fmspc: string, pceId: string, tcbInfo: TCBInfo) {
        if (fmspc !== tcbInfo.tcbInfo.fmspc) {
            throw new Error("Wrong FMSPC in PCK certificate");
        }
        if (pceId !== tcbInfo.tcbInfo.pceId) {
            throw new Error("Wrong PCEID in PCK certificate");
        }
        // TODO
        this.logger.warn(
            `Parsing quote's field header.PCESVN not supported.
            header.PCESVN must be >= any of tcbInfo.tcbLevels[].tcb.pcesvn.
            Get tcbInfo.tcbLevels[].tcbStatus from max tcbInfo.tcbLevels[].tcb.pcesvn`,
        );
    }

    public async validate(quoteString: string): Promise<string> {
        try {
            const quoteBuffer = Buffer.from(quoteString, "base64");
            const quote: TeeSgxQuoteDataType = this.teeSgxParser.parseQuote(quoteBuffer);
            const report: TeeSgxReportDataType = this.teeSgxParser.parseReport(quote.qeReport);

            await this.validateQuoteStructure(quote, report);
            this.logger.info("Quote structure validated successfully");

            const fmspc = this.getFmspc(quote);
            const pceId = this.getPceId(quote);
            const tcbInfo = await this.getTcbInfo(quote);
            const qeIdentity = await this.getQEIdentity(quote);

            this.checkQEIdentity(report, qeIdentity);
            this.checkTcbInfo(fmspc, pceId, tcbInfo);

            return "Quote valid";
        } catch (error) {
            this.logger.error(`Validation error: ${error}`);

            return `Quote not valid. Error: ${error}`;
        }
    }
}
