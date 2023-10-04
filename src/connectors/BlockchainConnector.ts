import { BaseConnector, Config } from './BaseConnector';
import Web3, { Block, Contract, TransactionReceipt, errors } from 'web3';
import {
    BLOCK_SIZE_TO_FETCH_TRANSACTION,
    POLYGON_MATIC_EVENT_PATH,
    defaultBlockchainUrl,
    defaultGasPrice,
} from '../constants';
import { checkIfActionAccountInitialized, incrementMethodCall } from '../utils/helper';
import { Transaction, TransactionOptions, EventData, BlockInfo } from '../types/Web3';
import BlockchainTransaction from '../types/blockchainConnector/StorageAccess';
import TxManager from '../utils/TxManager';
import { abi } from '../contracts/abi';
import { Wallet } from 'ethers';
const Jsonrpc = require('web3-core-requestmanager/src/jsonrpc');

// TODO: remove this dependencies
import store from '../store';
import Superpro from '../staticModels/Superpro';
import SuperproToken from '../staticModels/SuperproToken';
import { Monitoring } from '../utils/Monitoring';

class BlockchainConnector extends BaseConnector {
    private defaultActionAccount?: string;

    // Singleton
    private static instance: BlockchainConnector;

    private constructor() {
        super();
    }

    public static getInstance(): BlockchainConnector {
        if (!BlockchainConnector.instance) {
            BlockchainConnector.instance = new BlockchainConnector();
        }

        return BlockchainConnector.instance;
    }

    /**
     * Function for connecting to blockchain
     * Used to setting up settings for blockchain connector
     * Needs to run this function before using blockchain connector
     */
    public async initialize(config: Config): Promise<void> {
        this.logger.trace(config, 'Initializing');

        const url = config?.blockchainUrl || defaultBlockchainUrl;
        store.web3Https = new Web3();
        store.web3Https.setProvider(url);

        store.gasPrice = config?.gasPrice ?? defaultGasPrice;
        if (config?.gasLimit) store.gasLimit = config.gasLimit;
        if (config?.gasLimitMultiplier) store.gasLimitMultiplier = config.gasLimitMultiplier;
        if (config?.gasPriceMultiplier) store.gasPriceMultiplier = config.gasPriceMultiplier;
        if (config?.txConcurrency) store.txConcurrency = config.txConcurrency;
        if (config?.txIntervalMs) store.txIntervalMs = config.txIntervalMs;

        Superpro.address = config.contractAddress;
        this.contract = new Contract<typeof abi>(abi, Superpro.address, store.web3Https);

        TxManager.init(store.web3Https);
        SuperproToken.addressHttps = await Superpro.getTokenAddress(this.contract);
        Monitoring.getInstance().initializeLogging();
        this.initialized = true;

        this.logger.trace('Initialized');
    }

    /**
     * Function for connecting provider action account
     * Needs to run this function before using any set methods in blockchain connector
     */
    public async initializeActionAccount(
        actionAccountKey: string,
        manageNonce = true,
    ): Promise<string> {
        this.checkIfInitialized();

        store.web3Https!.eth.accounts.wallet.add(actionAccountKey);
        const actionAccount =
            store.web3Https!.eth.accounts.privateKeyToAccount(actionAccountKey).address;
        if (!store.actionAccount) store.actionAccount = actionAccount;
        if (!store.keys[actionAccount]) store.keys[actionAccount] = actionAccountKey;
        if (!this.defaultActionAccount) this.defaultActionAccount = actionAccount;
        if (manageNonce) {
            await TxManager.initAccount(actionAccount);
        }

        return actionAccount;
    }

    /**
     * Returns balance of blockchain platform tokens in wei
     */
    @incrementMethodCall()
    public getBalance(address: string): Promise<bigint> {
        this.checkIfInitialized();

        return store.web3Https!.eth.getBalance(address);
    }

    public async getTimestamp(): Promise<bigint> {
        this.checkIfInitialized();
        const block = await store.web3Https?.eth.getBlock('latest');

        return block!.timestamp;
    }

    /**
     * Returns transactions events info
     * @param txHash - transaction hash
     * @returns {Promise<EventData[]>} - Transaction events info
     */
    @incrementMethodCall()
    public async getTransactionEvents(txHash: string): Promise<EventData[]> {
        this.checkIfInitialized();
        const parseReceiptEvents = require('web3-parse-receipt-events');
        const receipt = await store.web3Https!.eth.getTransactionReceipt(txHash);
        const tokenEvents = parseReceiptEvents(abi, SuperproToken.addressHttps, receipt);
        parseReceiptEvents(abi, Superpro.address, receipt); // don't remove
        const events = Object.values(tokenEvents.events || {});

        const eventData: EventData[] = [];
        for (const event of events) {
            if ((event as any).address === POLYGON_MATIC_EVENT_PATH || !(event as any).event) {
                continue;
            }

            const data = (event as any).returnValues;
            const dataValues = Object.values(data);
            if (dataValues.length !== 0) {
                for (let i = 0; i < dataValues.length / 2; i++) {
                    delete data[i];
                }
            }

            eventData.push({
                contract: (event as any).address,
                name: (event as any).event,
                data,
            });
        }

        return eventData;
    }

    /**
     * Function for adding event listeners on TEE offer created event in TEE offers factory contract
     * @param callback - function for processing created TEE offer
     * @returns unsubscribe - unsubscribe function from event
     */
    public async getLastBlockInfo(): Promise<BlockInfo> {
        this.checkIfInitialized();

        const index = await store.web3Https!.eth.getBlockNumber();
        const hash = (await store.web3Https!.eth.getBlock(index)).hash;

        return {
            index,
            hash,
        };
    }

    /**
     * Returns transactions reciept
     * @param txHash - transaction hash
     * @returns {Promise<TransactionReceipt>} - Transaction reciept
     */
    public getTransactionReceipt(txHash: string): Promise<TransactionReceipt> {
        this.checkIfInitialized();

        return store.web3Https!.eth.getTransactionReceipt(txHash);
    }

    /**
     * Returns balance of blockchain platform tokens in wei
     */
    @incrementMethodCall()
    public transfer(
        to: string,
        amount: string,
        transactionOptions?: TransactionOptions,
    ): Promise<TransactionReceipt> {
        this.checkIfInitialized();
        checkIfActionAccountInitialized(transactionOptions);

        const transaction = {
            to,
            value: amount,
        };

        return TxManager.publishTransaction(transaction, transactionOptions);
    }

    /**
     * Returns transactions count
     * @param address - wallet address
     * @returns {Promise<number>} - Transactions count
     */
    public getTransactionCount(address: string, status?: string): Promise<bigint> {
        this.checkIfInitialized();
        if (status) {
            return store.web3Https!.eth.getTransactionCount(address, status);
        } else {
            return store.web3Https!.eth.getTransactionCount(address);
        }
    }

    public getAddressByKey(pk: string): string {
        return new Wallet(pk).address;
    }

    private executeBatchAsync(batch: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const requests = batch.requests;

            batch.requestManager.sendBatch(requests, (error: Error, results: any) => {
                if (error) return reject(error);
                results = results || [];

                const response = requests
                    .map((request: any, index: number) => {
                        return results[index] || {};
                    })
                    .map((result: any, index: number) => {
                        if (result && result.error) {
                            return new errors.ResponseError(error);
                        }

                        if (!Jsonrpc.isValidResponse(result)) {
                            return new errors.InvalidResponseError(result);
                        }

                        return requests[index].format
                            ? requests[index].format(result.result)
                            : result.result;
                    });

                resolve(response);
            });
        });
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
    @incrementMethodCall()
    public async getTransactions(
        addresses: string[],
        startBlock?: number,
        lastBlock?: number,
        batchSize: number = BLOCK_SIZE_TO_FETCH_TRANSACTION,
    ): Promise<BlockchainTransaction> {
        this.checkIfInitialized();

        const blockchainLastBlock = +(await store.web3Https!.eth.getBlockNumber()).toString();
        if (lastBlock) {
            lastBlock = Math.min(lastBlock, blockchainLastBlock);
        } else {
            lastBlock = blockchainLastBlock;
        }

        if (!startBlock) {
            startBlock = Math.max(lastBlock - 1000, 0);
        }

        const transactionsByAddress: { [key: string]: Transaction[] } = {};

        const validAddresses = addresses.filter((address) =>
            store.web3Https?.utils.isAddress(address),
        );
        if (!validAddresses.length) {
            return {
                transactionsByAddress,
                lastBlock,
            };
        }

        validAddresses.forEach((address) => (transactionsByAddress[address] = []));

        while (startBlock <= lastBlock) {
            const batch = new store.web3Https!.eth.BatchRequest();
            const getBlock: any = store.web3Https!.eth.getBlock;
            const batchLastBlock = Math.min(startBlock + batchSize - 1, lastBlock);

            for (let blockNumber = startBlock; blockNumber <= batchLastBlock; blockNumber++) {
                batch
                    .add(getBlock.request(blockNumber, true))
                    .catch((err) => this.logger.error(err));
            }
            const blocks = (await this.executeBatchAsync(batch)) as Block[];

            blocks.forEach((block: Block) => {
                if (!block?.transactions) return;

                block.transactions.forEach((transaction: any) => {
                    let address: string | null = null;
                    if (validAddresses.includes(transaction.from)) address = transaction.from;
                    else if (transaction.to && validAddresses.includes(transaction.to))
                        address = transaction.to;

                    if (address) {
                        transactionsByAddress[address].push({
                            ...transaction,
                            timestamp: Number(block.timestamp) * 1000,
                            input: transaction.input,
                        });
                    }
                });
            });

            startBlock = batchLastBlock + 1;
        }

        return {
            transactionsByAddress,
            lastBlock,
        };
    }

    public shutdown(): void {
        super.shutdown();
        store.web3Https = undefined;
        Monitoring.getInstance().shutdownLogging();
    }
}

export default BlockchainConnector;
