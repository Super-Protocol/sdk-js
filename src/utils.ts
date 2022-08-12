import store from "./store";
import { TransactionOptions } from "./types/Web3";
import { isArray } from "lodash";
import Web3 from "web3";

/**
 * Function for checking if BlockchainConnector initialized (required for get and set methods)
 * Used in all models constructors
 */
export const checkIfInitialized = () => {
    if (!store.isInitialized)
        throw new Error(
            "BlockchainConnector is not initialized, needs to run 'await BlockchainConnector.init(CONFIG)' first",
        );
};

/**
 * Function for checking if provider action account initialized (required for set methods)
 * Used in all set methods
 */
export const checkIfActionAccountInitialized = (transactionOptions?: TransactionOptions) => {
    if (!store.actionAccount && !transactionOptions?.web3)
        throw new Error(
            "Provider action account is not initialized, needs to run 'BlockchainConnector.initActionAccount(SECRET_KEY)' first",
        );
};

/**
 * Function for checking if current configuration supposed to use external transaction manager like MetaMask and etc.
 */
export const checkForUsingExternalTxManager = (transactionOptions?: TransactionOptions): boolean => {
    // TODO: Agree on more proper way of signaling, that we use an external transaction manager, than just passing a web3 instance.
    return !!transactionOptions?.web3;
};

/**
 * Updates gas price determined by the last few blocks median
 */
export const getGasPrice = async (web3: Web3): Promise<string> => {
    return web3.eth.getGasPrice();
};

/**
 * Merge transaction options from arguments and from store
 * Used in all set methods
 */
export const createTransactionOptions = async (options?: TransactionOptions): Promise<TransactionOptions> => {
    if (!options) options = {};
    if (!options.from) options.from = store.actionAccount;
    if (!options.gas) options.gas = store.gasLimit;
    if (!options.gasPrice) {
        if (store.gasPrice) {
            options.gasPrice = store.gasPrice;
        } else {
            const web3 = options.web3 || store.web3;
            if (!web3) {
                throw Error(
                    "web3 is undefined, define it in transaction options or initialize BlockchainConnector with web3 instance.",
                );
            }
            options.gasPrice = await getGasPrice(web3);
        }
    }
    delete options.web3;
    return options;
};

export const isNodeJS = () => {
    // @ts-ignore
    return typeof window === "undefined";
};

type FormatFunctions = {
    $obj?: (value: unknown) => unknown;
    $tuple?: (value: unknown) => unknown;
};

type FormatItem = Format | Object | ((value: unknown) => unknown) | null | FormatFunctions;

type Format =
    | FormatItem[]
    | {
          [key: string]: FormatItem;
      };

export const tupleToObject = <T>(data: unknown[], format: Format): T => {
    const processItem = (dataItem: unknown, formatItem: FormatItem) => {
        if ((formatItem as FormatFunctions)?.$obj) {
            return (formatItem as FormatFunctions).$obj!(dataItem);
        } else if (typeof formatItem === "function") {
            return (formatItem as Function)(dataItem);
        } else if (typeof formatItem === "object" && typeof dataItem === "object") {
            return tupleToObject(dataItem as unknown[], formatItem as Format);
        } else {
            return dataItem;
        }
    };

    if (isArray(format)) {
        const result = data.map((dataItem, index) => {
            const formatItem = index < format.length ? format[index] : format[format.length - 1];

            return processItem(dataItem, formatItem);
        });

        return result as unknown as T;
    } else {
        const result: { [key: string]: unknown } = {};

        Object.keys(format).forEach((key, index) => {
            const formatItem = format[key];
            const dataItem = data[index];
            result[key] = processItem(dataItem, formatItem);
        });

        return result as unknown as T;
    }
};

export const objectToTuple = (data: unknown, format: Format): unknown[] => {
    const processItem = (dataItem: unknown, formatItem: FormatItem) => {
        if ((formatItem as FormatFunctions)?.$tuple) {
            return (formatItem as FormatFunctions).$tuple!(dataItem);
        } else if (typeof formatItem === "object" && typeof dataItem === "object") {
            return objectToTuple(dataItem, formatItem as Format);
        } else {
            return dataItem;
        }
    };

    if (isArray(format)) {
        return (data as unknown[]).map((dataItem, index) => {
            const formatItem = index < format.length ? format[index] : format[format.length - 1];

            return processItem(dataItem, formatItem);
        });
    } else {
        return Object.keys(format).map((key) => {
            const dataItem = (data as { [key: string]: unknown })[key];
            const formatItem = format[key];

            return processItem(dataItem, formatItem);
        });
    }
};

export const getTimestamp = async (): Promise<number> => {
    const endBlockIndex = await store.web3!.eth.getBlockNumber();
    const block = await store.web3!.eth.getBlock(endBlockIndex, true);

    return Number(block.timestamp);
};
