import Web3 from "web3";
import { defaultGasLimit, defaultGasPrice } from "./constants";

export type Store = {
    isInitialized: boolean;
    web3?: Web3;
    actionAccount?: string;
    gasLimit: number;
    gasPrice: string;
    keys: Record<string, string>;
};

const store: Store = {
    isInitialized: false,
    web3: undefined,
    actionAccount: undefined,
    gasLimit: defaultGasLimit,
    gasPrice: defaultGasPrice,
    keys: {},
};

export default store;
