import { OptionInfo } from './OptionInfo';
import { BlockchainId } from './Order';
import { SlotUsage } from './SlotUsage';

export type TeeOfferOption = {
  id: BlockchainId;
  info: OptionInfo;
  usage: SlotUsage;
};
