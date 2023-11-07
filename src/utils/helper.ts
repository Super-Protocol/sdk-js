import store from '../store';
import { TransactionOptions } from '../types/Web3';
import Web3, { DecodedParams, JsonRpcError } from 'web3';
import { Web3BatchRequest } from 'web3-core';
import { Monitoring } from './Monitoring';
import { SlotInfo } from '../types/SlotInfo';
import {
  OptionInfo,
  PriceType,
  SlotUsage,
  TeeOfferOption,
  TeeOfferSlot,
  ValueOfferSlot,
} from '../types';
import { BLOCKCHAIN_BATCH_REQUEST_TIMEOUT } from '../constants';

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
    if (!web3) {
      throw Error(
        'web3 is undefined, define it in transaction options or initialize BlockchainConnector with web3 instance.',
      );
    }
    try {
      options.gasPrice = await getGasPrice(web3);
    } catch (e) {
      options.gasPrice = store.gasPrice;
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
    _target: unknown,
    propertyName: string,
    propertyDescriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const monitoring = Monitoring.getInstance();
    const method = propertyDescriptor.value;
    propertyDescriptor.value = function (...args: unknown[]): Promise<void> {
      monitoring.incrementCall(propertyName);

      return method.apply(this, args);
    };
    return propertyDescriptor;
  };
}

export function packDeviceId(hexedDeviceId: string): string {
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

export function convertBigIntToString(obj: any): any {
  if (typeof obj === 'bigint') {
    return obj.toString(); // Convert BigInt to string
  } else if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      // If it's an array, map each element
      return obj.map((item) => convertBigIntToString(item));
    } else {
      // If it's an object, recursively convert its properties
      const convertedObj: Record<string, any> = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          convertedObj[key] = convertBigIntToString(obj[key]);
        }
      }
      return convertedObj;
    }
  } else {
    return obj; // Leave other types unchanged
  }
}

export function formatTeeOfferOption(option: TeeOfferOption): TeeOfferOption {
  option = cleanWeb3Data(option);

  return {
    ...option,
    info: formatOptionInfo(option.info),
    usage: formatUsage(option.usage),
  };
}

export function formatTeeOfferSlot(slot: TeeOfferSlot, cpuDenominator: number): TeeOfferSlot {
  slot = cleanWeb3Data(slot);

  return {
    ...slot,
    info: unpackSlotInfo(slot.info, cpuDenominator),
    usage: formatUsage(slot.usage),
  };
}

export function formatOfferSlot(slot: ValueOfferSlot, cpuDenominator: number): ValueOfferSlot {
  slot = cleanWeb3Data(slot);

  return {
    ...slot,
    option: formatOptionInfo(slot.option),
    info: unpackSlotInfo(slot.info, cpuDenominator),
    usage: formatUsage(slot.usage),
  };
}

export function formatUsage(usage: SlotUsage): SlotUsage {
  return {
    priceType: usage.priceType.toString() as PriceType,
    price: usage.price,
    minTimeMinutes: Number(usage.minTimeMinutes),
    maxTimeMinutes: Number(usage.maxTimeMinutes),
  };
}

export function formatOptionInfo(optionInfo: OptionInfo): OptionInfo {
  return cleanWeb3Data(optionInfo);
}

export function unpackSlotInfo(slotInfo: SlotInfo, cpuDenominator: number): SlotInfo {
  return {
    cpuCores: Number(slotInfo.cpuCores) / cpuDenominator,
    ram: Number(slotInfo.ram),
    diskUsage: Number(slotInfo.diskUsage),
  };
}

export function packSlotInfo(slotInfo: SlotInfo, cpuDenominator: number): SlotInfo {
  return {
    cpuCores: slotInfo.cpuCores * cpuDenominator,
    ram: slotInfo.ram,
    diskUsage: slotInfo.diskUsage,
  };
}

export function isValidBytes32Hex(data: string): boolean {
  const regex = /^0x[a-fA-F0-9]{64}$/;
  return regex.test(data);
}

export const cleanWeb3Data = <T>(data: T): T => {
  const result: { [key: string]: unknown } = {};

  for (const key in data) {
    // If the value of the current key is an object (but not an array or null), recursively clean it
    if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
      result[key] = cleanWeb3Data(data[key] as DecodedParams);
      result[key] = convertBigIntToString(result[key]);
    } else if (Array.isArray(data[key])) {
      result[key] = (data[key] as Array<any>).map((item) =>
        typeof item === 'bigint' ? item.toString() : item,
      );
    } else if (typeof data[key] === 'bigint') {
      result[key] = (data[key] as bigint).toString();
    } else {
      result[key] = data[key];
    }
  }

  // Remove __length__ and numbered properties
  delete (result as any).__length__;
  for (let i = 0; i < ((data as any).__length__ ?? 0); i++) {
    delete result[i.toString()];
  }

  return result as T;
};

export const transformComplexObject = (obj: any): any => {
  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (!isNaN(Number(key))) {
      continue;
    }

    if (Array.isArray(value)) {
      result[key] = {};
      for (const [innerKey, innerValue] of Object.entries(value)) {
        if (!isNaN(Number(innerKey))) {
          continue;
        }
        result[key][innerKey] = innerValue;
      }
    } else {
      result[key] = value;
    }
  }

  return result;
};

export const executeBatchAsync = async <BatchResponse = unknown>(
  batch: Web3BatchRequest,
  timeout = BLOCKCHAIN_BATCH_REQUEST_TIMEOUT,
): Promise<BatchResponse[]> => {
  const result: BatchResponse[] = [];
  const responses = await batch.execute({ timeout });
  for (const response of responses) {
    if ('error' in response) {
      throw new Error((response.error as JsonRpcError).message);
    } else {
      result.push(response.result as BatchResponse);
    }
  }

  return result;
};
