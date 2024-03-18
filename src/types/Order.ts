import { formatBytes32String, parseBytes32String } from 'ethers/lib/utils.js';
import { TokenAmount, BlockchainId } from './Web3.js';
import { EncryptionKey } from '@super-protocol/dto-js';

export enum OrderStatus {
  New = '0',
  Processing = '1',
  Canceling = '2',
  Canceled = '3',
  Done = '4',
  Error = '5',
  Blocked = '6',
  Suspended = '7',
}

export type OrderArgs = {
  inputOffers: BlockchainId[];
  outputOffer: BlockchainId;
};

export type OrderSlots = {
  slotId: BlockchainId;
  slotCount: number;
  optionsIds: BlockchainId[];
  optionsCount: number[];
};

export type OrderInfo = {
  offerId: BlockchainId;
  resultInfo: {
    publicKey: string;
    encryptedInfo: string;
  };
  encryptedArgs: string;
  status: OrderStatus;
  externalId: string;
  expectedPrice?: TokenAmount;
  maxPriceSlippage?: TokenAmount;
  args: OrderArgs;
};

export type OrderInfoRaw = {
  offerId: BlockchainId;
  resultInfo: string;
  encryptedRequirements_DEPRECATED: string;
  encryptedArgs_DEPRECATED: string;
  status: OrderStatus;
  externalId: string;
  expectedPrice: TokenAmount;
  maxPriceSlippage: TokenAmount;
};

export const orderInfoToRaw = (orderInfo: OrderInfo): OrderInfoRaw => {
  const resultInfo = JSON.stringify({
    publicKey: orderInfo.resultInfo.publicKey,
    encryptedInfo: orderInfo.resultInfo.encryptedInfo,
    encryptedArgs: orderInfo.encryptedArgs,
  });
  return {
    offerId: orderInfo.offerId,
    resultInfo: resultInfo,
    encryptedRequirements_DEPRECATED: '',
    encryptedArgs_DEPRECATED: '',
    status: orderInfo.status,
    externalId: formatBytes32String(orderInfo.externalId),
    expectedPrice: orderInfo.expectedPrice ?? '0',
    maxPriceSlippage: orderInfo.maxPriceSlippage ?? '0',
  };
};

export const orderInfoFromRaw = (orderInfoBch: OrderInfoRaw, args: OrderArgs): OrderInfo => {
  let publicKey = '';
  let encryptedInfo = '';
  let encryptedArgs = orderInfoBch.encryptedArgs_DEPRECATED;
  try {
    const parsedFields = JSON.parse(orderInfoBch.resultInfo);
    publicKey = parsedFields.publicKey ?? publicKey;
    encryptedInfo = parsedFields.encryptedInfo ?? encryptedInfo;
    encryptedArgs = parsedFields.encryptedArgs ?? encryptedArgs;
  } catch (e) {}

  return {
    resultInfo: {
      publicKey,
      encryptedInfo,
    },
    encryptedArgs,
    offerId: orderInfoBch.offerId,
    status: orderInfoBch.status,
    externalId: parseBytes32String(orderInfoBch.externalId),
    args,
  };
};

export type ExtendedOrderInfo = OrderInfo & {
  blocking: boolean;
  deposit: TokenAmount;
};

export type OrderResult = {
  encryptedResult: string;
  orderPrice: TokenAmount;
};

export type SubOrderParams = {
  blockParentOrder: boolean;
  deposit: TokenAmount;
};

export type OrderEncryptedInfo = {
  publicKey: EncryptionKey;
  hashes: string[];
  linkage: string;
};
