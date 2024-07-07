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
export const ZERO_HASH: Hash = {
  hash: '0000000000000000000000000000000000000000000000000000000000000000',
  algo: HashAlgorithm.SHA256,
  encoding: Encoding.base64,
};
export const HOUR_IN_MS = 60 * 60 * 1000;
export const INACTIVE_TEE_OFFER_PERIOD_IN_HOURS = Number(
  process.env.INACTIVE_PERIOD_TEE_OFFER_IN_HOURS ?? 25,
);
export const INACTIVE_TCB_PERIOD = INACTIVE_TEE_OFFER_PERIOD_IN_HOURS * HOUR_IN_MS;
export const TEE_OFFER_SELECT_FRESH_SIZE = Number(process.env.TEE_OFFER_SELECT_FRESH_SIZE ?? 100);
