import rootLogger from "./logger";
import Web3 from "web3";
import { HttpProviderBase, WebsocketProviderBase } from "web3-core-helpers";
import store from "./store";
import { BLOCK_SIZE_TO_FETCH_TRANSACTION, defaultBlockchainUrl } from "./constants";
import { checkIfInitialized } from "./utils";
import { Transaction } from "./types/Web3";
import Superpro from "./staticModels/Superpro";
import SuperproToken from "./staticModels/SuperproToken";
import BlockchainTransaction from "./types/blockchainConnector/StorageAccess";

class BlockchainConnector {
    private static logger = rootLogger.child({ className: "BlockchainConnector" });
    private static provider?: HttpProviderBase | WebsocketProviderBase;

    public static defaultActionAccount?: string;

    /**
     * Function for connecting to blockchain
     * Used to setting up settings for blockchain connector
     * Needs to run this function before using blockchain connector
     */
    public static async init(config: Config): Promise<void> {
        if (store.isInitialized) return;

        const url = config?.blockchainUrl || defaultBlockchainUrl;

        if (/^(ws)|(wss)/.test(url)) {
            this.provider = new Web3.providers.WebsocketProvider(url, {
                reconnect: {
                    auto: true,
                    delay: 5000, // ms
                    maxAttempts: 5,
                    onTimeout: false,
                },
            });
            store.web3 = new Web3(this.provider);
        } else {
            this.provider = new Web3.providers.HttpProvider(url);
            store.web3 = new Web3(this.provider);
        }

        if (config?.gasLimit) store.gasLimit = config.gasLimit;
        if (config?.gasPrice) store.gasPrice = config.gasPrice;

        Superpro.address = config.contractAddress;
        SuperproToken.address = await Superpro.getTokenAddress();

        store.isInitialized = true;
    }

    /**
     * Function for connecting provider action account
     * Needs to run this function before using any set methods in blockchain connector
     */
    public static initActionAccount(actionAccountKey: string): string {
        checkIfInitialized();
        const actionAccount = store.web3!.eth.accounts.wallet.add(actionAccountKey).address;
        if (!store.actionAccount) store.actionAccount = actionAccount;
        if (!this.defaultActionAccount) this.defaultActionAccount = actionAccount;
        return actionAccount;
    }

    /**
     * Returns balance of blockchain platform tokens in wei
     */
    public static async getBalance(address: string): Promise<string> {
        checkIfInitialized();
        return store.web3!.eth.getBalance(address);
    }

    /**
     * Fetch transactions for specific addresses starting with specific block until last block
     * @param addresses - array of addresses to fetch transactions (from these addresses and to these addresses)
     * @param startBlock - number of block to start fetching transactions (if empty fetch only for last block)
     * @param lastBlock - number of block to last fetching transactions (if empty fetch only for last block)
     * @param batchSize - block size for asynchronous transaction loading
     * @returns {Promise<{
     *   transactionsByAddress, - found transactions sorted by addresses
     *   lastBlock, - number of last fetched block (can be used to start fetching from this block next time)
     * }>}
     */
    public static async getTransactions(
        addresses: string[],
        startBlock?: number,
        lastBlock?: number,
        batchSize: number = BLOCK_SIZE_TO_FETCH_TRANSACTION): Promise<BlockchainTransaction>{

        const endBlock = lastBlock? lastBlock: await store.web3!.eth.getBlockNumber();

        if (!startBlock) startBlock = endBlock;

        const blocksNumbersToFetch: number[][] = [[]];
        let activeStep = blocksNumbersToFetch[0];

        for (let i = startBlock; i <= endBlock; i++) {
            activeStep.push(i);

            if (activeStep.length >= batchSize) {
                blocksNumbersToFetch.push([]);
                activeStep = blocksNumbersToFetch[blocksNumbersToFetch.length - 1];
            }
        }

        const transactionsByAddress: { [key: string]: Transaction[] } = {};
        addresses.forEach((address) => (transactionsByAddress[address] = []));

        for (let i = 0; i < blocksNumbersToFetch.length; i++) {
            await Promise.all(
                blocksNumbersToFetch[i].map(async (blockNumber) => {
                    const block = await store.web3!.eth.getBlock(blockNumber, true);

                    block.transactions.forEach((transaction) => {
                        let address: string | null = null;
                        if (addresses.includes(transaction.from)) address = transaction.from;
                        else if (transaction.to && addresses.includes(transaction.to)) address = transaction.to;

                        if (address) {
                            transactionsByAddress[address].push({
                                ...transaction,
                                timestamp: +block.timestamp * 1000,
                                input: transaction.input,
                            });
                        }
                    });
                }),
            );
        }

        return {
            transactionsByAddress,
            lastBlock: endBlock,
        };
    }

    public static disconnect() {
        this.provider?.disconnect(0, "");
        store.isInitialized = false;
        store.web3 = undefined;
    }
}

export type Config = {
    contractAddress: string;
    blockchainUrl?: string;
    gasLimit?: number;
    gasPrice?: string;
};

export default BlockchainConnector;
