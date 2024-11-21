import { ExtendedTransactionInfo } from '../../types/index.js';

type BlockchainTransaction = {
  transactionsByAddress: { [p: string]: ExtendedTransactionInfo[] };
  lastBlock: number;
};

export default BlockchainTransaction;
