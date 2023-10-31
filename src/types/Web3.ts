import Web3, { Numbers, TransactionInfo } from 'web3';

export type BlockchainId = string;
export type TokenAmount = string;
export type BlockIndex = number;

export type BlockInfo = {
  index: BlockIndex;
  hash: string | undefined;
};

export type EventData = {
  contract: string;
  name: string;
  data: { [key: string]: unknown };
};

export type ExtendedTransactionInfo = TransactionInfo & {
  timestamp?: number;
};

type Filter = Record<string, Numbers | Numbers[] | boolean | boolean[]>;

export type FilterWithExternalId = Filter & {
  externalId: string;
};

export type EventOptions = {
  filter?: Filter;
  toBlock?: number | string;
  fromBlock?: number | string;
};

export type TransactionOptionsRequired = Required<TransactionOptions>;

export type BlockchainError = { message: string };

export type TransactionDataOptions = TransactionOptions & {
  to: string;
  nonce?: bigint;
  data?: string;
  value?: TokenAmount;
};

export type TransactionOptions = {
  from?: string;
  gas?: bigint;
  gasPrice?: bigint;
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
