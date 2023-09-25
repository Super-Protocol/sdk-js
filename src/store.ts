import Web3 from "web3";
import { defaultGasLimitMultiplier, defaultGasPriceMultiplier, defaultGasLimit } from "./constants";

export type Store = {
    web3Wss?: Web3;
    web3Https?: Web3;
    actionAccount?: string;
    gasLimit: bigint;
    gasLimitMultiplier: number;
    gasPriceMultiplier: number;
    gasPrice?: bigint;
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
    keys: {},
};

export default store;
