declare module 'pkijs' {
  interface AbstractCryptoEngine {
    generateKey(
      algorithm: 'Ed25519',
      extractable: boolean,
      keyUsages: ReadonlyArray<'sign' | 'verify'>,
    ): Promise<CryptoKeyPair>;
  }
}

export type TeeDataBlockType = {
  format: 'lzma' | 'gzip' | 'raw';
  userData: {
    hash: 'sha256' | 'sha384' | 'sha512';
    offset: 0 | number;
    size: 16 | number;
  };
};

export type TeeDataBlockQuoteFormatType = TeeDataBlockType['format'];

export type TeeDataKeysType = {
  class: 'ec';
  teePublic: {
    curve: 'secp256k1';
    format: 'der' | 'raw' | string;
    type: 'spki' | 'raw' | string;
  };
};

export type TeeDataType = {
  quote: TeeDataBlockType;
  keys: TeeDataKeysType;
  teePubKeyData: BinaryType;
};

export type BinaryType = Uint8Array | Buffer;

export type TLBlockType = {
  quote: BinaryType;
  data: BinaryType;
};

export type TLBlockUnserializeResultType = {
  quote: BinaryType;
  data: TeeDataType;
  dataBlob: BinaryType;
};
export type TLBlockSerializeResultType = BinaryType;

export enum QuoteType {
  SGX = 'Sgx',
  TDX = 'Tdx',
}
export class TeeQuoteBase {
  quoteType!: QuoteType;
  rawHeader!: BinaryType;
  ecdsaAttestationKey!: BinaryType;
  qeReport!: BinaryType;
  qeReportSignature!: BinaryType;
  qeAuthenticationData!: BinaryType;
  qeCertificationDataType!: number;
  qeCertificationData!: BinaryType;
  certificates!: {
    device: CertificateData;
    platform: CertificateData;
    root: CertificateData;
  };
}

export type TeeSgxHeaderData = {
  version: number;
  attestationKeyType: number;
  pceSvn: number;
  userData: BinaryType;
};

export class TeeSgxQuoteDataType extends TeeQuoteBase {
  header!: TeeSgxHeaderData;
  report!: BinaryType;
  isvEnclaveReportSignature!: BinaryType;
}
export type TeeTdxHeaderData = {
  version: number;
  attestationKeyType: number;
  teeType: number;
  reserved1: BinaryType;
  reserved2: BinaryType;
  qeVendorId: BinaryType;
  userData: BinaryType;
};

export class TeeTdxQuoteDataType extends TeeQuoteBase {
  header!: TeeTdxHeaderData;
  tdQuoteBody!: BinaryType;
  quoteSignature!: BinaryType;
  certDataType!: number;
}

export type TeeSgxReportDataType = {
  cpuSvn: string;
  mrEnclave: BinaryType;
  mrSigner: BinaryType;
  isvProdId: number;
  isvSvn: number;
  userData: BinaryType;
  dataHash: BinaryType; //first 32-bytes of userData, deprecated, use <userData> field.
};

export type ChunkedX509Cert = {
  bodyPartOne: string;
  publicKey: string;
  bodyPartTwo: string;
  signature: string;
};

export type CertificateData = {
  pem: string;
  x509Data: ChunkedX509Cert;
};

export type TeeTdxBodyType = {
  teeTcbSvn: BinaryType;
  mrSeam: BinaryType;
  mrSignerSeam: BinaryType;
  seamAttributes: BinaryType;
  tdAttributes: BinaryType;
  xfam: BinaryType;
  mrTd: BinaryType;
  mrConfigId: BinaryType;
  mrOwner: BinaryType;
  mrOwnerConfig: BinaryType;
  rtmr0: BinaryType;
  rtmr1: BinaryType;
  rtmr2: BinaryType;
  rtmr3: BinaryType;
  reportData: BinaryType;
  dataHash: BinaryType;
};
