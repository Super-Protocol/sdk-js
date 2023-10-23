import { ExtendedTransactionInfo } from '../../types';

type BlockchainTransaction = {
  transactionsByAddress: { [p: string]: ExtendedTransactionInfo[] };
  lastBlock: number;
};

export default BlockchainTransaction;
