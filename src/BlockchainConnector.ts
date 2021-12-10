import rootLogger from "./logger";
import Web3 from "web3";
import store from "./store";
import { defaultBlockchainUrl } from "./constants";
import { checkIfInitialized } from "./utils";
import { ContractName } from "./types/Superpro";
import { Transaction } from "./types/Web3";

import TeeOffersFactory from "./staticModels/TeeOffersFactory";
import OffersFactory from "./staticModels/OffersFactory";
import Superpro from "./staticModels/Superpro";
import OrdersFactory from "./staticModels/OrdersFactory";
import ProviderRegistry from "./staticModels/ProviderRegistry";
import Staking from "./staticModels/Staking";
import SuperproToken from "./staticModels/SuperproToken";
import Voting from "./staticModels/Voting";
import Consensus from "./staticModels/Consensus";
import LastBlocks from "./staticModels/LastBlocks";
import Suspicious from "./staticModels/Suspicious";

class BlockchainConnector {
    private static logger = rootLogger.child({ className: "BlockchainConnector" });

    public static defaultActionAccount?: string;

    /**
     * Function for connecting to blockchain
     * Used to setting up settings for blockchain connector
     * Needs to run this function before using blockchain connector
     */
    public static async init(config: Config) {
        store.web3 = new Web3(config?.blockchainUrl || defaultBlockchainUrl);
        if (config?.gasLimit) store.gasLimit = config.gasLimit;

        Superpro.address = config.contractAddress;

        const addressesToFetch: { name: ContractName; model: { address?: string } }[] = [
            { name: ContractName.TeeOffersFactory, model: TeeOffersFactory },
            { name: ContractName.ValueOffersFactory, model: OffersFactory },
            { name: ContractName.Orders, model: OrdersFactory },
            { name: ContractName.ProviderRegistry, model: ProviderRegistry },
            { name: ContractName.Staking, model: Staking },
            { name: ContractName.Token, model: SuperproToken },
            { name: ContractName.Voting, model: Voting },
            { name: ContractName.Consensus, model: Consensus },
            { name: ContractName.Suspicious, model: Suspicious },
            { name: ContractName.LastBlocks, model: LastBlocks },
        ];
        await Promise.all(
            addressesToFetch.map(async ({ name, model }) => {
                model.address = await Superpro.getContractAddress(name);
            })
        );

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
     * Fetch transactions for specific addresses starting with specific block until last block
     * @param addresses - array of addresses to fetch transactions (from this addresses and to this addresses)
     * @param startBlock - number of block to start fetching transactions (if empty fetch only for last block)
     * @returns Promise<{
     *   transactionsByAddress, - found transactions sorted by addresses
     *   lastBlock, - number of last fetched block (can be used to start fetching from this block next time)
     * }>
     */
    public static async getTransactions(addresses: string[], startBlock?: number) {
        const endBlock = await store.web3!.eth.getBlockNumber();

        if (!startBlock) startBlock = endBlock;

        const blocksNumbersToFetch: number[][] = [[]];
        let activeStep = blocksNumbersToFetch[0];
        for (let i = startBlock; i <= endBlock; i++) {
            activeStep.push(i);

            if (activeStep.length >= 500) {
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
                })
            );
        }

        return { transactionsByAddress, lastBlock: endBlock };
    }
}

export type Config = {
    contractAddress: string;
    blockchainUrl?: string;
    gasLimit?: number;
};

export default BlockchainConnector;
