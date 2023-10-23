import { OptionInfo } from './OptionInfo';
import { SlotUsage } from './SlotUsage';

export type TeeOfferOption = {
  id: bigint;
  info: OptionInfo;
  usage: SlotUsage;
};
