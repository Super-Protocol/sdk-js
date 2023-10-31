import { TokenAmount } from './Web3';

export enum PriceType {
  PerHour = '0',
  Fixed = '1',
}

export type SlotUsage = {
  priceType: PriceType;
  price: TokenAmount;
  minTimeMinutes: number;
  maxTimeMinutes: number;
};
