export enum LStatus {
    Invalid = "0",
    Negative = "1",
    Positive = "2",
}

export enum LType {
    L1 = "0",
    L2 = "1",
}

export type UsedData = {
    teeOffer: string;
    deviceID: string;
    benchmark: number;
    properties: string;
};

export type StoredData = {
    teeReport: string;
    teeSignature: string;
};

export type UtilityData = {
    L1: string[];
    L2: string[];
    L1_statusess: LStatus[];
    L2_statusess: LStatus[];
    negative: number;
    positive: number;
    paidOut: number;
    profitWithdrawDelayDays: number;
    L1Count: number;
    L2Count: number;
    previusTcb: string;
};
