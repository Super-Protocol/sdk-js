// Order of keys and type conversion functions for this object in blockchain contract
export const StakeInfoStructure = {
    startDate: Number,
    amount: Number,
    profit: Number,
    totalLocked: Number,
};
export type StakeInfo = {
    startDate: number;
    amount: number;
    profit: number;
    totalLocked: number;
};

// Order of keys and type conversion functions for this object in blockchain contract
export const LockInfoStructure = {
    fromDate: Number,
    toDate: Number,
    amount: Number,
};
export type LockInfo = {
    fromDate: number;
    toDate: number;
    amount: number;
};

export enum Purpose {
    Providers = "0",
    Orders = "1",
    Consensus = "2",
}
