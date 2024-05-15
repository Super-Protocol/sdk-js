import { TokenAmount } from './Web3.js';

export type DepositInfo = {
  amount: TokenAmount;
  totalLocked: TokenAmount;
  profit: TokenAmount;
};
