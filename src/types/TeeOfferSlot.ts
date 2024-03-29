import { BlockchainId } from './Web3';
import { SlotInfo } from './SlotInfo';
import { SlotUsage } from './SlotUsage';

export type TeeOfferSlot = {
  id: BlockchainId;
  info: SlotInfo;
  usage: SlotUsage;
};
