import { OptionInfo, OptionInfoRaw } from "./OptionInfo";
import { SlotInfo } from "./SlotInfo";
import { SlotUsage } from "./SlotUsage";
import { BlockchainId } from "./Web3";


export type OrderUsageBase = {
  slotCount: number;
  optionUsage: SlotUsage[];
  optionIds: BlockchainId[];
  optionsCount: number[];
};

export type OrderUsage = OrderUsageBase & {
  slotCount: number;
  optionInfo: OptionInfo[];
  optionUsage: SlotUsage[];
  optionIds: BlockchainId[];
  optionsCount: number[];
  slotInfo?: SlotInfo;
  slotUsage?: SlotUsage;
};


export type OrderUsageRaw = OrderUsageBase & {
  slotCount: number;
  optionInfo: OptionInfoRaw[];
  optionUsage: SlotUsage[];
  optionIds: BlockchainId[];
  optionsCount: number[];
};


