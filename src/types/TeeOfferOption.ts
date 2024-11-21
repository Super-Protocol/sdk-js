import { OptionInfo, OptionInfoRaw } from './OptionInfo.js';
import { BlockchainId } from './Web3.js';
import { SlotUsage } from './SlotUsage.js';

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
