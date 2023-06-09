import { SlotInfo, SlotInfoStructure } from "./SlotInfo";
import { SlotUsage, SlotUsageStructure } from "./SlotUsage";

// Order of keys and type conversion functions for this object in blockchain contract
export const TeeOfferSlotStructure = {
    id: String,
    info: SlotInfoStructure,
    usage: SlotUsageStructure,
};
export type TeeOfferSlot = {
    id: string;
    info: SlotInfo;
    usage: SlotUsage;
};
