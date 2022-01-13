import store from "./store";
import { TransactionOptions } from "./types/Web3";

/**
 * Function for checking if BlockchainConnector initialized (required for get and set methods)
 * Used in all models constructors
 */
export const checkIfInitialized = () => {
    if (!store.isInitialized)
        throw new Error(
            "BlockchainConnector is not initialized, needs to run 'await BlockchainConnector.init(CONFIG)' first"
        );
};

/**
 * Function for checking if provider action account initialized (required for set methods)
 * Used in all set methods
 */
export const checkIfActionAccountInitialized = () => {
    if (!store.actionAccount)
        throw new Error(
            "Provider action account is not initialized, needs to run 'BlockchainConnector.initActionAccount(SECRET_KEY)' first"
        );
};

/**
 * Merge transaction options from arguments and from store
 * Used in all set methods
 */
export const createTransactionOptions = (options?: TransactionOptions) => {
    if (!options) options = {};
    if (!options.from) options.from = store.actionAccount;
    if (!options.gas) options.gas = store.gasLimit;
    if (!options.gasPrice) options.gasPrice = store.gasPrice;
    return options;
};

export const isNodeJS = () => {
    // @ts-ignore
    return typeof window === 'undefined';
};
