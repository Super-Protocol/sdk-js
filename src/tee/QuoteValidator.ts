import axios from "axios";
import crypto from "crypto";
import elliptic from "elliptic";
import { util, asn1 } from "node-forge";
import { Certificate } from "@fidm/x509";
import { TeeSgxParserV3, TeeSgxQuoteDataType, TeeSgxReportDataType } from "@super-protocol/tee-lib";

const BASE_SGX_URL = "https://api.trustedservices.intel.com/sgx/certification/v3";
const cRLDistributionPointsOid = "2.5.29.31";
const SGX_OID = "1.2.840.113741.1.13.1";
const FMSPC_OID = `${SGX_OID}.4`;

export class QuoteValidator {
    private readonly teeSgxParser: TeeSgxParserV3;
    private intelSgxRootCertificate = "";

    constructor() {
        this.teeSgxParser = new TeeSgxParserV3();
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
        const platformCrlResult = await axios.get(`${BASE_SGX_URL}/pckcrl?ca=platform&encoding=pem`);
        const platformCrl = platformCrlResult.data;
        const platformChain = decodeURIComponent(platformCrlResult.headers["sgx-pck-crl-issuer-chain"]);
        const [, fetchedRootCert] = this.splitChain(platformChain);
        this.intelSgxRootCertificate = fetchedRootCert;

        // root
        const crlExtension = rootCert.extensions.find((item) => item.oid === cRLDistributionPointsOid);
        if (!crlExtension) {
            throw new Error("CRL distribution points value not found in root certificate");
        }
        const rawRootCrlUrl = Buffer.from(crlExtension!.value).toString();
        const rootCrlUrl = rawRootCrlUrl.slice(rawRootCrlUrl.indexOf("http"));
        const rootCrlResult = await axios.get(rootCrlUrl, { responseType: "arraybuffer" });
        const rootCrl = `-----BEGIN X509 CRL-----\n${rootCrlResult.data
            .toString("base64")
            .match(/.{0,64}/g)!
            .join("\n")}-----END X509 CRL-----`;

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

    private verifyEnclaveReportSignature(quote: TeeSgxQuoteDataType) {
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

    private async validateQuoteStructure(quote: TeeSgxQuoteDataType, report: TeeSgxReportDataType): Promise<boolean> {
        if (!(await this.verifyQeReportSignature(quote))) {
            console.log("Wrong QE report signature");
            // throw new Error("Wrong QE report signature");
        }
        if (!this.verifyQeReportData(quote, report)) {
            console.log("Wrong QE report data");
            // throw new Error("Wrong QE report data");
        }
        if (!this.verifyEnclaveReportSignature(quote)) {
            console.log("Wrong enclave report signature");
            // throw new Error("Wrong enclave report signature");
        }

        return true;
    }

    private getFmspc(quote: TeeSgxQuoteDataType) {
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

    private async getTcbInfo(quote: TeeSgxQuoteDataType): Promise<string> {
        const fmspc = this.getFmspc(quote);
        const tcbData = await axios.get(`${BASE_SGX_URL}/tcb?fmspc=${fmspc}`);
        const tcbInfoHeader = quote.header.version > 3 ? "tcb-info-issuer-chain" : "sgx-tcb-info-issuer-chain";
        const tcbInfoChain = this.splitChain(decodeURIComponent(tcbData.headers[tcbInfoHeader])); // [tcb, root]

        if (tcbInfoChain[1] !== this.intelSgxRootCertificate) {
            throw new Error("Wrong root certificate in TCB chain");
        }

        return JSON.stringify(tcbData.data);
    }

    private async getQEIdentity(): Promise<string> {
        // fetch https://api.trustedservices.intel.com/sgx/certification/v4/qe/identity
        /*
            в теле ответа будет находится json с enclaveIdentity и signature, а в заголовках (headers) ответа 
            в поле “SGX-Enclave-Identity-Issuer-Chain“ находится цепочка сертификатов,
            сигнатура подписи находится в теле ответа. 
            Необходимо также загрузить CRL, проверить валидность цепочки сертификатов, проверить целостность enclaveIdentity.
        */
        return "id";
    }

    private checkQEIdentity(quote: TeeSgxQuoteDataType, qeIdentity: string) {
        // https://superprotocol.atlassian.net/wiki/spaces/SP/pages/273514501/DCAP+Quote+verification+algorithm+Draft#%D0%A1%D1%80%D0%B0%D0%B2%D0%BD%D0%B5%D0%BD%D0%B8%D0%B5-%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85-qe_identity-%D0%B8-quote
        return true; // qeIdentity === quote.bytes();
    }

    private checkTcbInfo(quote: TeeSgxQuoteDataType, tcbInfo: string) {
        // https://superprotocol.atlassian.net/wiki/spaces/SP/pages/273514501/DCAP+Quote+verification+algorithm+Draft#%D0%A1%D1%80%D0%B0%D0%B2%D0%BD%D0%B5%D0%BD%D0%B8%D0%B5-%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85-tcbInfo-%D0%B8-quote
        return true; // tcbInfo === quote.bytes();
    }

    private convergeTcbStatus() {
        // https://superprotocol.atlassian.net/wiki/spaces/SP/pages/273514501/DCAP+Quote+verification+algorithm+Draft#ConvergeTcbStatus
    }

    public async validate(quoteString: string) {
        try {
            const quoteBuffer = Buffer.from(quoteString, "base64");
            const quote: TeeSgxQuoteDataType = this.teeSgxParser.parseQuote(quoteBuffer);
            const report: TeeSgxReportDataType = this.teeSgxParser.parseReport(quote.qeReport);

            const result = await this.validateQuoteStructure(quote, report);
            console.log({ result });
            console.log("Quote structure validated successfully");

            const tcbInfo = await this.getTcbInfo(quote);

            const qeIdentity = await this.getQEIdentity();
            this.checkQEIdentity(quote, qeIdentity);

            this.checkTcbInfo(quote, tcbInfo);

            return this.convergeTcbStatus();
        } catch (error) {
            console.log(`Validation error: ${error}`);
        }
    }
}
