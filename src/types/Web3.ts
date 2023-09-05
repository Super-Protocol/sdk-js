import Web3 from "web3";

// Event what used as payload for Web3 events
export type ContractEvent = {
    blockHash: string;
    blockNumber: number;
    returnValues: { [key: string]: unknown };
};

export type BlockInfo = {
    index: number;
    hash: string;
};

export type EventData = {
    contract: string;
    name: string;
    data: any;
};

export type TransactionOptionsRequired = Required<TransactionOptions>;

export type TransactionOptions = {
    from?: string;
    gas?: number;
    gasPrice?: string;
    gasPriceMultiplier?: number;
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

export type DryRunError = Error & {
    txErrorMsg: string | null;
};
