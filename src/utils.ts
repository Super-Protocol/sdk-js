import store from "./store";
import { TransactionOptions } from "./types/Web3";
import { isArray } from "lodash";
import Web3 from "web3";
import { Monitoring } from "./utils/Monitoring";

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
    if (!options.gasPriceMultiplier) options.gasPriceMultiplier = store.gasPriceMultiplier;
    if (!options.gasPrice) {
        const web3 = options.web3 || store.web3Https;
        if (web3) {
            try {
                options.gasPrice = await getGasPrice(web3);
            } catch (e) {
                options.gasPrice = store.gasPrice;
            }
        } else {
            throw Error(
                "web3 is undefined, define it in transaction options or initialize BlockchainConnector with web3 instance.",
            );
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

export const tupleToObjectsArray = <T>(data: unknown[], format: Format): T[] => {
    return data.map((item) => tupleToObject(item as unknown[], format));
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

export function packDevicId(hexedDeviceId: string): string {
    if (hexedDeviceId.length !== 64) {
        throw new Error("DeviceId must be equal 64 hex symbols");
    }

    if (!hexRegex.test(hexedDeviceId)) {
        throw new Error("DeviceId must be a hexedecimal");
    }

    return "0x" + hexedDeviceId;
}

export function unpackDeviceId(bytes32: string): string {
    if (bytes32.length !== 66) {
        throw new Error("DeviceId bytes must be equal 66 symbols");
    }

    // removes '0x'
    return bytes32.slice(2, 66);
}
