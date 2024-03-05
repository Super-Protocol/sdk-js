import { TokenAmount, BlockchainId } from './Web3';

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
  resultInfo: string; // it contains 'publicKey' and 'encryptedPublicKey'(only for Loader)
  encryptedRequirements_DEPRECATED?: string;
  encryptedArgs_DEPRECATED?: string;
  status: OrderStatus;
  externalId: string;
  expectedPrice?: TokenAmount;
  maxPriceSlippage?: TokenAmount;
  args: OrderArgs;
};

export const removeOrderDeprecatedFields = (orderInfo: OrderInfo): OrderInfo => {
  try {
    delete orderInfo['encryptedRequirements_DEPRECATED'];
    delete orderInfo['encryptedArgs_DEPRECATED'];
  } catch (e) {}
  return orderInfo;
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
