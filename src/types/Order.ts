import { SlotUsage } from './SlotUsage';
import { SlotInfo } from './SlotInfo';
import { OptionInfo } from './OptionInfo';

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
  inputOffers: bigint[];
  outputOffer: bigint;
};

export type OrderSlots = {
  slotId: bigint;
  slotCount: number;
  optionsIds: bigint[];
  optionsCount: number[];
};

export type OrderInfo = {
  offerId: bigint;
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
  deposit: bigint;
};

export type OrderResult = {
  encryptedResult: string;
  orderPrice: bigint;
};

export type SubOrderParams = {
  blockParentOrder: boolean;
  deposit: bigint;
};

export type OrderUsage = {
  slotInfo: SlotInfo;
  slotUsage: SlotUsage;
  optionInfo: OptionInfo[];
  optionUsage: SlotUsage[];
  optionsCount: number[];
};
