import { TokenAmount, BlockchainId } from './Web3';
import { formatBytes32String, parseBytes32String } from 'ethers/lib/utils';

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
  publicKey: string;
  encryptedInfo: string;
  encryptedArgs: string;
  status: OrderStatus;
  externalId: string;
  expectedPrice?: TokenAmount;
  maxPriceSlippage?: TokenAmount;
  args: OrderArgs;
};

export type OrderInfoRaw = {
  offerId: BlockchainId;
  fieldsDataBlob: string;
  encryptedRequirements_DEPRECATED: string;
  encryptedArgs_DEPRECATED: string;
  status: OrderStatus;
  externalId: string;
  expectedPrice: TokenAmount;
  maxPriceSlippage: TokenAmount;
};

export const orderInfoToRaw = (orderInfo: OrderInfo): OrderInfoRaw => {
  const fieldsDataBlob = JSON.stringify({
    publicKey: orderInfo.publicKey,
    encryptedInfo: orderInfo.encryptedInfo,
    encryptedArgs: orderInfo.encryptedArgs,
  });
  return {
    offerId: orderInfo.offerId,
    fieldsDataBlob,
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
    const parsedFields = JSON.parse(orderInfoBch.fieldsDataBlob!);
    publicKey = parsedFields.publicKey ?? publicKey;
    encryptedInfo = parsedFields.encryptedInfo ?? encryptedInfo;
    encryptedArgs = parsedFields.encryptedArgs ?? encryptedArgs;
  } catch (e) {}
  return {
    publicKey,
    encryptedInfo,
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
