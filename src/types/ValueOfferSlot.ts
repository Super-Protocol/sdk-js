import { OptionInfo, OptionInfoStructure } from './OptionInfo';
import { SlotInfo, SlotInfoStructure } from './SlotInfo';
import { SlotUsage, SlotUsageStructure } from './SlotUsage';

// Order of keys and type conversion functions for this object in blockchain contract
export const ValueOfferSlotStructure = {
    id: String,
    info: SlotInfoStructure,
    option: OptionInfoStructure,
    usage: SlotUsageStructure,
};
export type ValueOfferSlot = {
    id: string;
    info: SlotInfo;
    option: OptionInfo;
    usage: SlotUsage;
};
