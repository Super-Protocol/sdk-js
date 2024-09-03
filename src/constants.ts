import { Encoding, Hash, HashAlgorithm } from '@super-protocol/dto-js';

export const defaultBlockchainUrl = 'http://127.0.0.1:8545';
export const defaultGasLimit = BigInt(7000000);
export const defaultGasPrice = BigInt(3000000000);
export const defaultGasPriceMultiplier = 1;
export const defaultGasLimitMultiplier = 1.2;
export const txConcurrency = 10;
export const txIntervalMs = 34;
export const ONE_DAY = 24 * 60 * 60;
export const BLOCK_SIZE_TO_FETCH_TRANSACTION = 500;
export const POLYGON_MATIC_EVENT_PATH = '0x0000000000000000000000000000000000001010';
export const BLOCKCHAIN_CALL_RETRY_ATTEMPTS = 10;
export const BLOCKCHAIN_CALL_RETRY_INTERVAL = 3000;
export const BLOCKCHAIN_BATCH_REQUEST_TIMEOUT = 10000;
export const POLYGON_MAIN_CHAIN_ID = 137;
export const POLYGON_AMOY_CHAIN_ID = 80002;
export const AMOY_TX_COST_LIMIT = BigInt('500000000000000000');
export const AMOY_TX_GAS_LIMIT = BigInt('5000000');
export const ZERO_HASH: Hash = {
  hash: '0000000000000000000000000000000000000000000000000000000000000000',
  algo: HashAlgorithm.SHA256,
  encoding: Encoding.base64,
};
export const TEE_LOADER_TRUSTED_MRSIGNER = Buffer.from(
  '4a5cb479b8a30fa3821b88aa29bad04788ea006a9e09925bf3ec36398fc9d64b',
  'hex',
);
