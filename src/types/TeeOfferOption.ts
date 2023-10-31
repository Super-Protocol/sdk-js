import { OptionInfo } from './OptionInfo';
import { BlockchainId } from './Web3';
import { SlotUsage } from './SlotUsage';

export type TeeOfferOption = {
  id: BlockchainId;
  info: OptionInfo;
  usage: SlotUsage;
};
