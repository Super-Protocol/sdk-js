import store from "./store";
import { TransactionOptions } from "./types/Web3";
import { isArray } from "lodash";
import Web3 from "web3";
import { Monitoring } from "./utils/Monitoring";
import { toUtf8Bytes, toUtf8String } from "ethers/lib/utils";
import { arrayify, BytesLike, concat, hexlify } from "@ethersproject/bytes";
import { HashZero } from "@ethersproject/constants";

/**
 * Function for checking if provider action account initialized (required for set methods)
 * Used in all set methods
 */
export const checkIfActionAccountInitialized = (transactionOptions?: TransactionOptions) => {
    if (!store.actionAccount && !transactionOptions?.web3)
        throw new Error(
            "Provider action account is not initialized, needs to run 'BlockchainConnector.getInstance().initializeActionAccount(SECRET_KEY)' first",
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
            const web3 = options.web3 || store.web3Https;
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

export function incrementMethodCall() {
    return function (_target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
        const monitoring = Monitoring.getInstance();
        const method = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args: any[]): Promise<void> {
            monitoring.incrementCall(propertyName);

            return method.apply(this, args);
        };
        return propertyDescriptor;
    };
}

const hexRegex = /^[0-9a-fA-F]+$/;

export function formatHexStringToBytes32(text: string): string {
    if (!hexRegex.test(text)) {
        throw new Error("formatted value - is not a hex");
    }

    // Get the bytes
    const bytes = toUtf8Bytes(text);

    // Check we have room for null-termination
    if (bytes.length > 32) {
        throw new Error("bytes32 string must be less or equal than 32 bytes");
    }

    // Zero-pad (implicitly null-terminates)
    return hexlify(concat([bytes, HashZero]).slice(0, 32));
}

export function parseBytes32toHexString(bytes: BytesLike): string {
    const data = arrayify(bytes);

    // Must be 32 bytes
    if (data.length !== 32) {
        throw new Error("invalid bytes32 - not 32 bytes long");
    }

    // Find the null termination
    let length = 32;
    while (data[length - 1] === 0) {
        length--;
    }

    // Determine the string value
    const decodedValue = toUtf8String(data.slice(0, length));
    if (!hexRegex.test(decodedValue)) {
        throw new Error("parsed value - is not a hex");
    }

    return decodedValue;
}
