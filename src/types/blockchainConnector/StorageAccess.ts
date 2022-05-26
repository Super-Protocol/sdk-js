import { Transaction } from "../Web3";


type BlockchainTransaction = {
    transactionsByAddress:{[p: string]: Transaction[]},
    lastBlock: number,
};

export default BlockchainTransaction;
