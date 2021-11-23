// Event what used as payload for Web3 events
export type ContractEvent = {
    returnValues: { [key: string]: unknown };
};

export type TransactionOptions = {
    from?: string;
    gas?: number;
};
