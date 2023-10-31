import { BlockchainId } from './Web3';

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
