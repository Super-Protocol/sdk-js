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
