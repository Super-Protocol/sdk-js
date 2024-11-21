import {
  TeeDataType,
  BinaryType,
  TLBlockUnserializeResultType,
  TLBlockSerializeResultType,
  TLBlockType,
} from './types.js';

/**
 * Serializes and Unserializes TLB
 */
export interface TLBlockSerializer {
  unserializeTlb(
    blob: BinaryType,
  ): TLBlockUnserializeResultType | Promise<TLBlockUnserializeResultType>;

  serializeTlb(
    tlb: TLBlockType,
    tlbMetadata: TeeDataType,
  ): TLBlockSerializeResultType | Promise<TLBlockSerializeResultType>;

  serializeMetadata(tlbMetadata: TeeDataType): BinaryType | Promise<BinaryType>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serializeAnyData(anyData: any): BinaryType;
}

interface IISVSVNStatus {
  tcb: {
    isvsvn: number;
  };
  tcbDate: string;
  tcbStatus: string;
}

export interface IQEIdentity {
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
    tcbLevels: [IISVSVNStatus];
  };
}

interface sgxTcbComponent {
  svn: number;
  category: string;
  type: string;
}

interface ITCBSVNStatus {
  tcb: {
    sgxtcbcomponents: [sgxTcbComponent];
    pcesvn: number;
  };
  tcbDate: string;
  tcbStatus: string;
  advisoryIDs: [string];
}

export interface ITcbData {
  signature: string;
  tcbInfo: {
    id: string;
    version: number;
    issueDate: string;
    nextUpdate: string;
    fmspc: string;
    pceId: string;
    tcbType: number;
    tcbEvaluationDataNumber: number;
    tcbLevels: [ITCBSVNStatus];
  };
}
