import { TokenAmount } from './Web3';

export type DepositInfo = {
  amount: TokenAmount;
  totalLocked: TokenAmount;
  profit: TokenAmount;
};
