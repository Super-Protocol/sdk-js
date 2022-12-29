import { BaseConnector, Config } from "./BaseConnector";
import Web3 from "web3";
import { BlockTransactionObject } from "web3-eth/types";
import { errors } from "web3-core-helpers";
import {
    BLOCK_SIZE_TO_FETCH_TRANSACTION,
    POLYGON_MATIC_EVENT_PATH,
    defaultBlockchainUrl,
} from "../constants";
import { checkIfActionAccountInitialized, incrementMethodCall } from "../utils";
import { Transaction, TransactionOptions, EventData, BlockInfo } from "../types/Web3";
import BlockchainTransaction from "../types/blockchainConnector/StorageAccess";
import TxManager from "../utils/TxManager";
import appJSON from "../contracts/app.json";
import { TransactionReceipt } from "web3-core";
import { Wallet } from "ethers";
import { AbiItem } from "web3-utils";
const Jsonrpc = require('web3-core-requestmanager/src/jsonrpc');

// TODO: remove this dependencies
import store from "../store";
import Superpro from "../staticModels/Superpro";
import SuperproToken from "../staticModels/SuperproToken";


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

    // TODO: remove this
    public getContract(transactionOptions?: TransactionOptions) {
        this.checkIfInitialized();

        if (transactionOptions?.web3) {
            return new transactionOptions.web3.eth.Contract(<AbiItem[]>appJSON.abi, Superpro.address);
        }

        return super.getContract();
    }
    /**
     * Function for connecting to blockchain
     * Used to setting up settings for blockchain connector
     * Needs to run this function before using blockchain connector
     */
    public async initialize(config: Config): Promise<void> {
        this.logger.trace(config, "Initializing");

        const url = config?.blockchainUrl || defaultBlockchainUrl;
        this.provider = new Web3.providers.HttpProvider(url);
        store.web3Https = new Web3(this.provider);

        if (config?.gasPrice) store.gasPrice = config.gasPrice;
        if (config?.gasLimit) store.gasLimit = config.gasLimit;
        if (config?.gasLimitMultiplier) store.gasLimitMultiplier = config.gasLimitMultiplier;

        Superpro.address = config.contractAddress;
        this.contract = new store.web3Https!.eth.Contract(<AbiItem[]>appJSON.abi, Superpro.address);

        TxManager.init(store.web3Https);
        SuperproToken.addressHttps = await Superpro.getTokenAddress(this.contract);

        this.initialized = true;

        this.logger.trace("Initialized");
    }

    /**
     * Function for connecting provider action account
     * Needs to run this function before using any set methods in blockchain connector
     */
    public async initializeActionAccount(actionAccountKey: string, manageNonce = true): Promise<string> {
        this.checkIfInitialized();

        const actionAccount = store.web3Https!.eth.accounts.wallet.add(actionAccountKey).address;
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
    public async getBalance(address: string): Promise<string> {
        this.checkIfInitialized();
        return store.web3Https!.eth.getBalance(address);
    }

    public async getTimestamp(): Promise<number | string> {
        this.checkIfInitialized();
        const block = await store.web3Https?.eth.getBlock("latest");

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
        const parseReceiptEvents = require("web3-parse-receipt-events");
        const receipt = await store.web3Https!.eth.getTransactionReceipt(txHash);
        const tokenEvents = parseReceiptEvents(appJSON.abi, SuperproToken.addressHttps, receipt);
        parseReceiptEvents(appJSON.abi, Superpro.address, receipt); // don't remove
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
     * @return unsubscribe - unsubscribe function from event
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
    public async getTransactionReceipt(txHash: string): Promise<TransactionReceipt> {
        this.checkIfInitialized();

        return store.web3Https!.eth.getTransactionReceipt(txHash);
    }

    /**
     * Returns balance of blockchain platform tokens in wei
     */
    @incrementMethodCall()
    public async transfer(
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
    public async getTransactionCount(address: string, status?: string): Promise<number> {
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

    private async executeBatchAsync(batch: any) {
        return new Promise((resolve, reject) => {
            var requests = batch.requests;

            batch.requestManager.sendBatch(requests, (error: Error, results: any) => {
                if (error) return reject(error);
                results = results || [];

                var response = requests.map((request: any, index: number) => {
                    return results[index] || {};

                }).map((result: any, index: number) => {

                    if (result && result.error) {
                        return errors.ErrorResponse(result);
                    }

                    if (!Jsonrpc.isValidResponse(result)) {
                        return errors.InvalidResponse(result);
                    }

                    return requests[index].format ? requests[index].format(result.result) : result.result;
                });

                resolve(response);
            });
        })

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

        const blockchainLastBlock = await store.web3Https!.eth.getBlockNumber();
        if (lastBlock) {
            lastBlock = Math.min(lastBlock, blockchainLastBlock);
        } else {
            lastBlock = blockchainLastBlock;
        }

        if (!startBlock) {
            startBlock = Math.max(lastBlock - 1000, 0);
        }

        const transactionsByAddress: { [key: string]: Transaction[] } = {};
        addresses.forEach((address) => (transactionsByAddress[address] = []));

        while (startBlock <= lastBlock) {
            const batch = new store.web3Https!.eth.BatchRequest();
            const getBlock: any = store.web3Https!.eth.getBlock;
            const batchLastBlock = Math.min(startBlock + batchSize - 1, lastBlock);

            for (let blockNumber = startBlock; blockNumber! <= batchLastBlock; blockNumber!++) {
                batch.add(getBlock.request(blockNumber, true));
            }
            const blocks = await this.executeBatchAsync(batch) as BlockTransactionObject[];

            blocks.forEach((block: BlockTransactionObject) => {
                if (!block?.transactions) return;

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
            });

            startBlock = batchLastBlock + 1;
        }

        return {
            transactionsByAddress,
            lastBlock,
        };
    }

    public shutdown() {
        super.shutdown();
        store.web3Https = undefined;
    }
}

export default BlockchainConnector;
