export enum LType {
    L1 = "0",
    L2 = "1",
}

// Order of keys and type conversion functions for this object in blockchain contract
export const PublicDataStructure = {
    teeOffer: String,
    deviceID: String,
    benchmark: Number,
    properties: String,
};
export type PublicData = {
    teeOffer: string;
    deviceID: string;
    benchmark: number;
    properties: string;
};

// Order of keys and type conversion functions for this object in blockchain contract
export const TcbEpochInfoStructure = {
    index: Number,
    valid: Boolean,
    reparation: Boolean,
};
export type TcbEpochInfo = {
    index: number;
    valid: boolean;
    reparation: boolean;
};
