import { SlotUsage } from './SlotUsage';
import { SlotInfo } from './SlotInfo';
import { OptionInfo } from './OptionInfo';
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
  resultPublicKey: string;
  encryptedRequirements: string;
  encryptedArgs: string;
  status: OrderStatus;
  args: OrderArgs;
  slots: OrderSlots;
  externalId: string;
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

export type OrderUsage = {
  slotInfo: SlotInfo;
  slotUsage: SlotUsage;
  optionInfo: OptionInfo[];
  optionUsage: SlotUsage[];
  optionsCount: number[];
};
