import Web3 from "web3";
import { defaultGasLimit } from "./constants";

export type Store = {
    isInitialized: boolean;
    web3?: Web3;
    actionAccount?: string;
    gasLimit: number;
};

const store: Store = {
    isInitialized: false,
    web3: undefined,
    actionAccount: undefined,
    gasLimit: defaultGasLimit,
};

export default store;
