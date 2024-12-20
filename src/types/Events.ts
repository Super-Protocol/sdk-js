import { OrderStatus } from './Order.js';
import { BlockchainId, TokenAmount } from './Web3.js';

export type OfferCreatedEvent = {
  creator: string;
  externalId: string;
  offerId: BlockchainId;
};

export type OrderCreatedEvent = {
  consumer: string;
  externalId: string;
  offerId: BlockchainId;
  parentOrderId: BlockchainId;
  orderId: BlockchainId;
  deposit: TokenAmount;
  orderStatus: OrderStatus;
};

export type TeeSlotAddedEvent = {
  creator: string;
  offerId: BlockchainId;
  slotId: BlockchainId;
  externalId: string;
};

export type ValueSlotAddedEvent = {
  creator: string;
  offerId: BlockchainId;
  slotId: BlockchainId;
  externalId: string;
};

export type OptionAddedEvent = {
  creator: string;
  teeOfferId: BlockchainId;
  optionId: BlockchainId;
  externalId: string;
};
