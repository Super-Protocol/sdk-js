import { HardwareInfo, HardwareInfoStructure } from './HardwareInfo';

// Order of keys and type conversion functions for this object in blockchain contract
export const TeeOfferInfoStructure = {
    name: String,
    description: String,
    teeType: String,
    properties: String,
    tlb: String,
    argsPublicKey: String,
    hardwareInfo: HardwareInfoStructure,
};
export type TeeOfferInfo = {
    name: string;
    description: string;
    teeType: string;
    properties: string;
    tlb: string;
    argsPublicKey: string;
    hardwareInfo: HardwareInfo;
};
