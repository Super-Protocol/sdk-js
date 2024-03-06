import { OptionInfo, OptionInfoRaw } from './OptionInfo.js';
import { BlockchainId } from './Web3.js';
import { SlotInfo } from './SlotInfo.js';
import { SlotUsage } from './SlotUsage.js';

type ValueOfferSlotBase = {
  id: BlockchainId;
  info: SlotInfo;
  usage: SlotUsage;
};

export type ValueOfferSlot = ValueOfferSlotBase & {
  option: OptionInfo;
};

export type ValueOfferSlotRaw = ValueOfferSlotBase & {
  option: OptionInfoRaw;
};
