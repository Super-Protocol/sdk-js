// Order of keys for this object in blockchain contract
export const StakeInfoArguments = ["startDate", "amount", "profit", "totalLocked"];
export type StakeInfo = {
    startDate: number;
    amount: number;
    profit: number;
    totalLocked: number;
};

// Order of keys for this object in blockchain contract
export const LockInfoArguments = ["fromDate", "toDate", "amount"];
export type LockInfo = {
    fromDate: number;
    toDate: number;
    amount: number;
};
