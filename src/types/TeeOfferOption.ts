import { OptionInfo, OptionInfoStructure } from "./OptionInfo";
import { SlotUsage, SlotUsageStructure } from "./SlotUsage";

// Order of keys and type conversion functions for this object in blockchain contract
export const TeeOfferOptionStructure = {
    id: String,
    info: OptionInfoStructure,
    usage: SlotUsageStructure,
};
export type TeeOfferOption = {
    id: string;
    info: OptionInfo;
    usage: SlotUsage;
};
