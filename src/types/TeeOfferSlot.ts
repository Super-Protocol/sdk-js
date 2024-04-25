import { BlockchainId } from './Web3.js';
import { SlotInfo } from './SlotInfo.js';
import { SlotUsage } from './SlotUsage.js';

export type TeeOfferSlot = {
  id: BlockchainId;
  info: SlotInfo;
  usage: SlotUsage;
};
