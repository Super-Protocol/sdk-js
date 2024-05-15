import Web3 from 'web3';
import {
  defaultGasLimitMultiplier,
  defaultGasPriceMultiplier,
  defaultGasLimit,
  txIntervalMs,
  txConcurrency,
  POLYGON_MAIN_CHAIN_ID
} from './constants.js';

export type Store = {
  web3Wss?: Web3;
  web3Https?: Web3;
  actionAccount?: string;
  gasLimit: bigint;
  gasLimitMultiplier: number;
  gasPriceMultiplier: number;
  gasPrice?: bigint;
  txConcurrency: number;
  txIntervalMs: number;
  chainId: number;
  keys: Record<string, string>;
};

const store: Store = {
  web3Wss: undefined,
  web3Https: undefined,
  actionAccount: undefined,
  gasLimit: defaultGasLimit,
  gasLimitMultiplier: defaultGasLimitMultiplier,
  gasPriceMultiplier: defaultGasPriceMultiplier,
  gasPrice: undefined,
  chainId: 137, // Polygon mainnet 
  txConcurrency: txConcurrency,
  txIntervalMs: txIntervalMs,
  chainId: POLYGON_MAIN_CHAIN_ID,
  keys: {},
};

export default store;
