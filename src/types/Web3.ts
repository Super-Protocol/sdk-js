import Web3 from "web3";

// Event what used as payload for Web3 events
export type ContractEvent = {
    returnValues: { [key: string]: unknown };
};

export type TransactionOptions = {
    from?: string;
    gas?: number;
    gasPrice?: string;
    web3?: Web3;
};

export type Transaction = {
    hash: string;
    nonce: number;
    blockHash: string | null;
    blockNumber: number | null;
    transactionIndex: number | null;
    from: string;
    to: string | null;
    value: string;
    gasPrice: string;
    gas: number;
    input: string;
    timestamp: number;
};
