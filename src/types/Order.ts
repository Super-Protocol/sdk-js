import { parseBytes32String } from "ethers/lib/utils";
import { SlotUsage, SlotUsageStructure } from "./SlotUsage";
import { SlotInfo, SlotInfoStructure } from "./SlotInfo";
import { OptionInfo, OptionInfoStructure } from "./OptionInfo";

export enum OrderStatus {
    New = "0",
    Processing = "1",
    Canceling = "2",
    Canceled = "3",
    Done = "4",
    Error = "5",
    Blocked = "6",
    Suspended = "7",
}

// Order of keys and type conversion functions for this object in blockchain contract
export const OrderArgsStructure = {
    inputOffers: [String],
    outputOffer: String,
};
export type OrderArgs = {
    inputOffers: string[];
    outputOffer: string;
};

// Order of keys and type conversion functions for this object in blockchain contract
export const OrderInfoStructure = {
    offerId: String,
    resultPublicKey: String,
    encryptedRequirements: String,
    encryptedArgs: String,
    status: OrderStatus,
    args: OrderArgsStructure,
    externalId: parseBytes32String,
    slotId: String,
    slotCount: String,
    optionsIds: [String],
    optionsCount: [String],
};

// Array of order info structures
export const OrderInfoStructureArray = [OrderInfoStructure];

export type OrderInfo = {
    offerId: string;
    resultPublicKey: string;
    encryptedRequirements: string;
    encryptedArgs: string;
    status: OrderStatus;
    args: OrderArgs;
    externalId: string;
    slotId: string;
    slotCount: string;
    optionsIds: string[];
    optionsCount: string[];
};
export type ExtendedOrderInfo = OrderInfo & {
    blocking: boolean;
    deposit: string;
};

// Order of keys and type conversion functions for this object in blockchain contract
export const OrderResultStructure = {
    encryptedResult: String,
    orderPrice: String,
};

export type OrderResult = {
    encryptedResult: string;
    orderPrice: string;
};

export type SubOrderParams = {
    blockParentOrder: boolean;
    deposit: string;
};

export type OrderUsage = {
    slotInfo: SlotInfo;
    slotUsage: SlotUsage;
    optionInfo: OptionInfo[];
    optionUsage: SlotUsage[];
    optionsCount: number[];
};

export const OrderUsageStructure = {
    slotInfo: SlotInfoStructure,
    slotUsage: SlotUsageStructure,
    optionInfo: [OptionInfoStructure],
    optionUsage: [SlotUsageStructure],
    optionsCount: [Number],
};
