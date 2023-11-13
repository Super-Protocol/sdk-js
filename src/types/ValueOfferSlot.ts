import { OptionInfo, OptionInfoRaw } from './OptionInfo';
import { BlockchainId } from './Web3';
import { SlotInfo } from './SlotInfo';
import { SlotUsage } from './SlotUsage';


type ValueOfferSlotBase= {
  id: BlockchainId;
  info: SlotInfo;
  usage: SlotUsage;
};

export type ValueOfferSlotRaw = ValueOfferSlotBase & {
  option: OptionInfoRaw;
};

export type ValueOfferSlot = ValueOfferSlotBase & {
  option: OptionInfo;
};
