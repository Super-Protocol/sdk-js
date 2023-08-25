interface quoteStructure {
    quoteHeader: {
        version: string;
        attestationKeyType: string;
        qeSvn: string;
        pceSvn: string;
        qeVendorId: string;
        userData: string;
    };
    isvEnclaveReport: {
        cpuSvn: string;
        miscSelect: string;
        attributes: string;
        mrEnclave: string;
        mrSigner: string;
        isvProdId: string;
        isvSvn: string;
        reportData: string;
    };
    quoteSignatureLength: string;
    quoteSignatureData: {
        isvEnclaveReportSignature: string;
        ecdsaAttestationKey: string;
        qeReport: string;
        qeReportSignature: string;
        qeAuthenticationData: {
            size: string;
            data: string;
        };
        qecertificationData: {
            certificationDataType: string;
            size: string;
            certificationData: string;
        };
    };
}

export class QuoteValidator {
    private verifyQEReportSignature() {
        /*
            Проверить целостность данных QE Report из данных подписи с помощью цепочки сертификатов “Certification Data“,
            которая включает в себя (PCK Certificate → Platform CA → Intel Root CA + CRL, url которого хранится в PCK Certificate).
            Эталонное значение сигнатуры хранится в поле “Qe Report Signature“
        */
    }

    private verifyQEReportData() {
        /*
            Берется SHA256-hash от поля QE Authentication Data (без поля size) и ECDSA Attestation Key.
            Полученное значение сравнивается со значением поля (первые 32 байта из 64) Report Data структуры QE Report.
        */
    }

    private verifyEnclaveReportSignature() {
        /*
            Значение Quote Header и ISV Enclave Report проверяется ключем ECDSA Attestation Key
            по сигнатуре ISV Enclave Report Signature.
        */
    }

    private async validateQuoteStructure() {
        this.verifyQEReportSignature();
        this.verifyQEReportData();
        this.verifyEnclaveReportSignature();
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

    private checkQEIdentity(quote: string, qeIdentity: string) {
        // https://superprotocol.atlassian.net/wiki/spaces/SP/pages/273514501/DCAP+Quote+verification+algorithm+Draft#%D0%A1%D1%80%D0%B0%D0%B2%D0%BD%D0%B5%D0%BD%D0%B8%D0%B5-%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85-qe_identity-%D0%B8-quote
        return qeIdentity === quote;
    }

    private checkTcbInfo(quote: string, tcbInfo: string) {
        // https://superprotocol.atlassian.net/wiki/spaces/SP/pages/273514501/DCAP+Quote+verification+algorithm+Draft#%D0%A1%D1%80%D0%B0%D0%B2%D0%BD%D0%B5%D0%BD%D0%B8%D0%B5-%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85-tcbInfo-%D0%B8-quote
        return tcbInfo === quote;
    }

    private convergeTcbStatus() {
        // https://superprotocol.atlassian.net/wiki/spaces/SP/pages/273514501/DCAP+Quote+verification+algorithm+Draft#ConvergeTcbStatus
    }

    public async validate(quote: string) {
        this.validateQuoteStructure();

        const qeIdentity = await this.getQEIdentity();
        this.checkQEIdentity(quote, qeIdentity);

        const tcbInfo = await this.getTcbInfo();
        this.checkTcbInfo(quote, tcbInfo);

        return this.convergeTcbStatus();
    }
}
