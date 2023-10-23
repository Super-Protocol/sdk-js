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

export type TeeSgxQuoteDataType = {
  rawHeader: BinaryType;
  header: {
    version: number;
    attestationKeyType: number;
    pceSvn: number;
    userData: BinaryType;
  };
  report: BinaryType;
  isvEnclaveReportSignature: BinaryType;
  ecdsaAttestationKey: BinaryType;
  qeReport: BinaryType;
  qeReportSignature: BinaryType;
  qeAuthenticationData: BinaryType;
  qeCertificationDataType: number;
  qeCertificationData: BinaryType;
};

export type TeeSgxReportDataType = {
  cpuSvn: string;
  mrEnclave: BinaryType;
  mrSigner: BinaryType;
  isvProdId: number;
  isvSvn: number;
  userData: BinaryType;
  dataHash: BinaryType; //first 32-bytes of userData, deprecated, use <userData> field.
};
