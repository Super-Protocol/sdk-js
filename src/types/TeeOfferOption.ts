import { OptionInfo, OptionInfoRaw } from './OptionInfo';
import { BlockchainId } from './Web3';
import { SlotUsage } from './SlotUsage';

export type TeeOfferOptionBase = {
  id: BlockchainId;
  usage: SlotUsage;
};

export type TeeOfferOption = TeeOfferOptionBase & {
  info: OptionInfo;
};

export type TeeOfferOptionRaw = TeeOfferOptionBase & {
  info: OptionInfoRaw;
};
