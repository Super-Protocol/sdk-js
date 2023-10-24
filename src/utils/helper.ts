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

export function formatTeeOfferOption(option: TeeOfferOption): TeeOfferOption {
  return {
    ...option,
    info: formatOptionInfo(option.info),
    usage: formatUsage(option.usage),
  };
}

export function formatTeeOfferSlot(slot: TeeOfferSlot, cpuDenominator: number): TeeOfferSlot {
  return {
    ...slot,
    info: unpackSlotInfo(slot.info, cpuDenominator),
    usage: formatUsage(slot.usage),
  };
}

export function formatOfferSlot(slot: ValueOfferSlot, cpuDenominator: number): ValueOfferSlot {
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
  return {
    bandwidth: Number(optionInfo.bandwidth),
    traffic: Number(optionInfo.traffic),
    externalPort: Number(optionInfo.externalPort),
  };
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

export const cleanEventData = (data: DecodedParams): { [key: string]: unknown } => {
  const result = { ...data };
  delete (result as any).__length__;

  for (let i = 0; i < (data.__length__ ?? 0); i++) {
    delete result[i.toString()];
  }

  return result;
};

export const executeBatchAsync = async <BatchResponse = unknown>(
  batch: Web3BatchRequest,
): Promise<BatchResponse[]> => {
  const result: BatchResponse[] = [];
  const responses = await batch.execute();
  for (const response of responses) {
    if ('error' in response) {
      throw new Error((response.error as JsonRpcError).message);
    } else {
      result.push(response.result as BatchResponse);
    }
  }

  return result;
};
