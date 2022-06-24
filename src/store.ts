import Web3 from "web3";
import { defaultGasLimitMultiplier, defaultGasLimit } from "./constants";

export type Store = {
    isInitialized: boolean;
    web3?: Web3;
    actionAccount?: string;
    gasLimit: number;
    gasLimitMultiplier: number;
    gasPrice?: string;
    keys: Record<string, string>;
};

const store: Store = {
    isInitialized: false,
    web3: undefined,
    actionAccount: undefined,
    gasLimit: defaultGasLimit,
    gasLimitMultiplier: defaultGasLimitMultiplier,
    gasPrice: undefined,
    keys: {},
};

export default store;
