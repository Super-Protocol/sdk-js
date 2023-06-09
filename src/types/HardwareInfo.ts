import { OptionInfo, OptionInfoStructure } from "./OptionInfo";
import { SlotInfo, SlotInfoStructure } from "./SlotInfo";

// Order of keys and type conversion functions for this object in blockchain contract
export const HardwareInfoStructure = {
    slotInfo: SlotInfoStructure,
    optionInfo: OptionInfoStructure,
};
export type HardwareInfo = {
    slotInfo: SlotInfo;
    optionInfo: OptionInfo;
};
