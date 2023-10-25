import { OptionInfo } from './OptionInfo';
import { BlockchainId } from './Order';
import { SlotInfo } from './SlotInfo';
import { SlotUsage } from './SlotUsage';

export type ValueOfferSlot = {
  id: BlockchainId;
  info: SlotInfo;
  option: OptionInfo;
  usage: SlotUsage;
};
