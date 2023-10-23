import { SlotInfo } from './SlotInfo';
import { SlotUsage } from './SlotUsage';

export type TeeOfferSlot = {
    id: bigint;
    info: SlotInfo;
    usage: SlotUsage;
};
