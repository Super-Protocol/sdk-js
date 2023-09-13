import axios from "axios";
import { asn1, md, pki, util } from "node-forge";
import crypto from "crypto";
import elliptic from "elliptic";
import { Certificate, PublicKey } from "@fidm/x509";
import { TeeSgxParserV3, TeeSgxQuoteDataType, TeeSgxReportDataType } from "@super-protocol/tee-lib";

const BASE_SGX_URL = "https://api.trustedservices.intel.com/sgx/certification/v3";
const cRLDistributionPointsOid = "2.5.29.31";

export class QuoteValidator {
    private readonly teeSgxParser: TeeSgxParserV3;

    constructor() {
        this.teeSgxParser = new TeeSgxParserV3();
    }

    private splitChain(chain: string): string[] {
        return chain
            .split("-----BEGIN CERTIFICATE-----")
            .filter((cert) => cert)
            .map((cert) => `-----BEGIN CERTIFICATE-----` + cert);
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

    private verifyQeReportData(quote: TeeSgxQuoteDataType): boolean {
        const qeAuthData = Buffer.from(quote.qeAuthenticationData);
        const attestationKey = Buffer.from(quote.ecdsaAttestationKey);
        const qeReportData = Buffer.from(quote.qeReport.subarray(0, 32));
        const hash = crypto.createHash("sha256");
        const hashResult = hash.update(qeAuthData).update(attestationKey).digest();
        const result = Buffer.compare(qeReportData, hashResult);

        return result === 0;
    }

    private verifyEnclaveReportSignature(quote: TeeSgxQuoteDataType) {
        const key = Buffer.from(quote.ecdsaAttestationKey);
        const expected = quote.isvEnclaveReportSignature;

        const hash = crypto.createHash("sha256");
        hash.update(Buffer.from(quote.rawHeader)).update(Buffer.from(quote.report));
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

    private async validateQuoteStructure(quote: TeeSgxQuoteDataType): Promise<boolean> {
        if (!(await this.verifyQeReportSignature(quote))) {
            console.log("Wrong QE report signature");
            // throw new Error("Wrong QE report signature");
        }
        if (!this.verifyQeReportData(quote)) {
            console.log("Wrong QE report data");
            // throw new Error("Wrong QE report data");
        }
        if (!this.verifyEnclaveReportSignature(quote)) {
            console.log("Wrong enclave report signature");
            // throw new Error("Wrong enclave report signature");
        }

        return true;
    }

    private getFmspc() {
        /*
            FMSPC хранится в PCK сертификате квоты. Для извлечения необходимо прочитать расширение с OID 1.2.840.113741.1.13.1 
            и прочитать из него поле с OID 1.2.840.113741.1.13.1.4 
        */
    }

    private async getTcbInfo(): Promise<string> {
        const fmspc = this.getFmspc();
        // fetch https://api.trustedservices.intel.com/sgx/certification/v4/tcb?fmspc={}
        /*
            в теле ответа будет находится json с tcbInfo и signature, а в заголовках (headers) ответа 
            в поле “TCB-Info-Issuer-Chain“ (или “SGX-TCB-Info-Issuer-Chain” для версий API 2 и 3) находится цепочка сертификатов,
            сигнатура подписи находится в теле ответа. 
            Стоит отметить что версии API 2  и 3 доступны до 31 октября 2025 года.
        */
        return "TcbInfo";
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
            const report: TeeSgxReportDataType = this.teeSgxParser.parseReport(quote.report);

            const res = await this.validateQuoteStructure(quote);
            console.log({ res });

            const qeIdentity = await this.getQEIdentity();
            this.checkQEIdentity(quote, qeIdentity);

            const tcbInfo = await this.getTcbInfo();
            this.checkTcbInfo(quote, tcbInfo);

            return this.convergeTcbStatus();
        } catch (error) {
            console.log(`Validation error: ${error}`);
        }
    }
}
