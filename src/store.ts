import Web3 from 'web3';
import {
    defaultGasLimitMultiplier,
    defaultGasPriceMultiplier,
    defaultGasLimit,
    txIntervalMs,
    txConcurrency,
} from './constants';

export type Store = {
    web3Wss?: Web3;
    web3Https?: Web3;
    actionAccount?: string;
    gasLimit: bigint | number;
    gasLimitMultiplier: number;
    gasPriceMultiplier: number;
    gasPrice?: string;
    txConcurrency: number;
    txIntervalMs: number;
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
    txConcurrency: txConcurrency,
    txIntervalMs: txIntervalMs,
    keys: {},
};

export default store;
