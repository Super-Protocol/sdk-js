import {
    TeeDataType,
    BinaryType,
    TLBlockUnserializeResultType,
    TLBlockSerializeResultType,
    TLBlockType,
} from './types';

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

interface ITCBSVNStatus {
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

export interface ITCBInfo {
    signature: string;
    tcbInfo: {
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
