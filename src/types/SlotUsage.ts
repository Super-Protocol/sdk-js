export enum PriceType {
    PerHour = '0',
    Fixed = '1',
}

// Order of keys and type conversion functions for this object in blockchain contract
export const SlotUsageStructure = {
    priceType: PriceType,
    price: String,
    minTimeMinutes: Number,
    maxTimeMinutes: Number,
};
export type SlotUsage = {
    priceType: PriceType;
    price: string;
    minTimeMinutes: number;
    maxTimeMinutes: number;
};
