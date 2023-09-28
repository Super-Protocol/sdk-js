import { OptionInfo } from './OptionInfo';
import { SlotInfo } from './SlotInfo';
import { SlotUsage } from './SlotUsage';

export type ValueOfferSlot = {
    id: string;
    info: SlotInfo;
    option: OptionInfo;
    usage: SlotUsage;
};
