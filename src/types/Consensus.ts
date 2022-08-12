export enum TcbVerifiedStatus {
    Valid = "0",
    InvalidQuote = "1",
    InvalidMrEnclave = "2",
    InvalidBcbHash = "3",
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
export const EpochStructure = {
    startDate: Number,
    endDate: Number,
    reward: String,
    benchmark: Number,
    reparation: String,
    reparationBenchmark: Number,
};
export type Epoch = {
    startDate: number;
    endDate: number;
    reward: string;
    benchmark: number;
    reparation: string;
    reparationBenchmark: number;
};
export enum TcbStatus {
    Inited = "0",
    Completed = "1",
    Banned = "2",
    BenchmarkChanged = "3",
}

// Order of keys and type conversion functions for this object in blockchain contract
export const TcbEpochInfoStructure = {
    index: Number,
    valid: Boolean,
};
export type TcbEpochInfo = {
    index: number;
    valid: boolean;
};

export type CheckingTcbData = {
    deviceID: string;
    properties: string;
    benchmark: number;
    tcbQuote: string;
    tcbMarks: string;
};
