export enum PriceType {
    PerHour = '0',
    Fixed = '1',
}

export type SlotUsage = {
    priceType: PriceType;
    price: string;
    minTimeMinutes: number;
    maxTimeMinutes: number;
};
