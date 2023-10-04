import store from '../store';
import { TransactionOptions } from '../types/Web3';
import Web3 from 'web3';
import { Monitoring } from './Monitoring';
import { SlotInfo } from '../types/SlotInfo';

/**
 * Function for checking if provider action account initialized (required for set methods)
 * Used in all set methods
 */
export const checkIfActionAccountInitialized = (transactionOptions?: TransactionOptions): void => {
    if (!store.actionAccount && !transactionOptions?.web3)
        throw new Error(
            "Provider action account is not initialized, needs to run 'BlockchainConnector.getInstance().initializeActionAccount(SECRET_KEY)' first",
        );
};

/**
 * Function for checking if current configuration supposed to use external transaction manager like MetaMask and etc.
 */
export const checkForUsingExternalTxManager = (
    transactionOptions?: TransactionOptions,
): boolean => {
    // TODO: Agree on more proper way of signaling, that we use an external transaction manager, than just passing a web3 instance.
    return !!transactionOptions?.web3;
};

/**
 * Updates gas price determined by the last few blocks median
 */
export const getGasPrice = (web3: Web3): Promise<bigint> => {
    return web3.eth.getGasPrice();
};

export const multiplyBigIntByNumber = (big: bigint, num: number): bigint => {
    const factor = BigInt(Math.pow(10, (num.toString().split('.')[1] || '').length));
    const result = big * BigInt(Math.round(num * Number(factor)));

    return result / factor;
};

/**
 * Merge transaction options from arguments and from store
 * Used in all set methods
 */
export const createTransactionOptions = async (
    options?: TransactionOptions,
): Promise<TransactionOptions> => {
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
                'web3 is undefined, define it in transaction options or initialize BlockchainConnector with web3 instance.',
            );
        }
    }
    delete options.web3;

    return options;
};

export const isNodeJS = (): boolean => {
    return typeof window === 'undefined';
};

export function incrementMethodCall() {
    return function (
        _target: any,
        propertyName: string,
        propertyDescriptor: PropertyDescriptor,
    ): PropertyDescriptor {
        const monitoring = Monitoring.getInstance();
        const method = propertyDescriptor.value;
        propertyDescriptor.value = function (...args: any[]): Promise<void> {
            monitoring.incrementCall(propertyName);

            return method.apply(this, args);
        };
        return propertyDescriptor;
    };
}

export function packDevicId(hexedDeviceId: string): string {
    const hexRegex = /^[0-9a-fA-F]+$/;

    if (hexedDeviceId.length !== 64) {
        throw new Error('DeviceId must be equal 64 hex symbols');
    }

    if (!hexRegex.test(hexedDeviceId)) {
        throw new Error('DeviceId must be a hexedecimal');
    }

    return '0x' + hexedDeviceId;
}

export function unpackDeviceId(bytes32: string): string {
    if (bytes32.length !== 66) {
        throw new Error('DeviceId bytes must be equal 66 symbols');
    }

    // removes '0x'
    return bytes32.slice(2, 66);
}

export function unpackSlotInfo(slotInfo: SlotInfo, cpuDenominator: number): SlotInfo {
    return {
        cpuCores: slotInfo.cpuCores / cpuDenominator,
        ram: slotInfo.ram,
        diskUsage: slotInfo.diskUsage,
    };
}

export function packSlotInfo(slotInfo: SlotInfo, cpuDenominator: number): SlotInfo {
    return {
        cpuCores: slotInfo.cpuCores * cpuDenominator,
        ram: slotInfo.ram,
        diskUsage: slotInfo.diskUsage,
    };
}
