export enum LType {
    L1 = "0",
    L2 = "1",
}

export type PublicData = {
    teeOffer: string;
    deviceID: string;
    benchmark: number;
    properties: string;
};

export type TcbEpochInfo = {
    index: number;
    valid: boolean;
    reparation: boolean;
};
