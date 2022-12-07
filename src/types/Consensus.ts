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
    teeOffer?: string;
    deviceID: string;
    benchmark: number;
    properties: string;
};

export const UtilityDataStructure = {
    checkingBlocks: [Number],
    checkingBlockMarks: [TcbVerifiedStatus],
    lastBlocksTakenAmount: Number,
    suspiciousBlocksTakenAmount: Number,
    negative: Number,
    positive: Number,
    previousTcb: Number,
    lastBlocksTaken: Boolean,
    suspiciousBlocksTaken: Boolean,
    assignedToEpoch: Boolean,
    checked: Boolean,
    rewardClaimed: Boolean,
};
export type UtilityData = {
    checkingBlocks: [number];
    checkingBlockMarks: [TcbVerifiedStatus];
    lastBlocksTakenAmount: number;
    suspiciousBlocksTakenAmount: number;
    negative: number;
    positive: number;
    previousTcb: number;
    lastBlocksTaken: boolean;
    suspiciousBlocksTaken: boolean;
    assignedToEpoch: boolean;
    checked: boolean;
    rewardClaimed: boolean;
};

// Order of keys and type conversion functions for this object in blockchain contract
export const EpochStructure = {
    reward: String,
    benchmark: Number,
    penaltyBenchmark: Number,
};
export type Epoch = {
    reward: string;
    benchmark: number;
    penaltyBenchmark: number;
};

export enum TcbStatus {
    Inited = "0",
    Completed = "1",
    Banned = "2",
    BenchmarkChanged = "3",
}

// Order of keys and type conversion functions for this object in blockchain contract
export const TcbStructure = {
    quote: String,
    timeInitialized: Number,
    timeAdded: Number,
    publicData: PublicDataStructure,
    utilData: UtilityDataStructure,
    status: TcbStatus,
};
export type TcbData = {
    quote: string;
    timeInitialized: number;
    timeAdded: number;
    publicData: PublicData;
    utilData: UtilityData;
    status: TcbStatus;
};

export type EpochInfo = {
    reward: number;
    benchmark: number;
    penaltyBenchmark: number;
};

export type CheckingTcbData = {
    deviceId: string;
    properties: string;
    benchmark: number;
    quote: string;
    marks: [TcbVerifiedStatus];
    checkingBlocks: [number];
};
