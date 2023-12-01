import { OptionInfo, OptionInfoRaw } from './OptionInfo';
import { BlockchainId } from './Web3';
import { SlotInfo } from './SlotInfo';
import { SlotUsage } from './SlotUsage';


type ValueOfferSlotBase= {
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