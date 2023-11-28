import { BaseConnector, Config } from './BaseConnector';
import Web3, {
  AbiParameter,
  Block,
  Contract,
  TransactionInfo,
  TransactionReceipt,
  Web3Context,
} from 'web3';
import { encodeEventSignature, decodeLog } from 'web3-eth-abi';
import {
  BLOCK_SIZE_TO_FETCH_TRANSACTION,
  POLYGON_MATIC_EVENT_PATH,
  defaultBlockchainUrl,
  defaultGasPrice,
} from '../constants';
import {
  checkIfActionAccountInitialized,
  cleanWeb3Data,
  incrementMethodCall,
  executeBatchAsync,
  preparePrivateKey,
} from '../utils/helper';
import {
  TransactionOptions,
  EventData,
  BlockInfo,
  ExtendedTransactionInfo,
  TokenAmount,
} from '../types/Web3';
import BlockchainTransaction from '../types/blockchainConnector/StorageAccess';
import TxManager from '../utils/TxManager';
import { abi } from '../contracts/abi';
import { Wallet } from 'ethers';

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
    store.web3Https = new Web3(url);
    const web3Context = new Web3Context({
      provider: store.web3Https.currentProvider,
      config: { contractDataInputFill: 'data' },
    });

    store.gasPrice = config?.gasPrice ?? defaultGasPrice;
    if (config?.gasLimit) store.gasLimit = config.gasLimit;
    if (config?.gasLimitMultiplier) store.gasLimitMultiplier = config.gasLimitMultiplier;
    if (config?.gasPriceMultiplier) store.gasPriceMultiplier = config.gasPriceMultiplier;
    if (config?.txConcurrency) store.txConcurrency = config.txConcurrency;
    if (config?.txIntervalMs) store.txIntervalMs = config.txIntervalMs;

    Superpro.address = config.contractAddress;
    this.contract = new Contract<typeof abi>(abi, Superpro.address, web3Context);

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
    const preparedActionAccountKey = preparePrivateKey(actionAccountKey);

    store.web3Https!.eth.accounts.wallet.add(preparedActionAccountKey);
    const actionAccount =
      store.web3Https!.eth.accounts.privateKeyToAccount(preparedActionAccountKey).address;
    if (!store.actionAccount) store.actionAccount = actionAccount;
    if (!store.keys[actionAccount]) store.keys[actionAccount] = preparedActionAccountKey;
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
  public getBalance(address: string): Promise<string> {
    this.checkIfInitialized();

    return store.web3Https!.eth.getBalance(address).then((balance) => balance.toString());
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
    const receipt = await store.web3Https!.eth.getTransactionReceipt(txHash);

    const eventData: EventData[] = [];
    const eventsDescriptor = abi
      .filter((desc) => desc.type === 'event')
      .map((desc) => ({
        ...desc,
        signature: encodeEventSignature(desc),
      }));

    for (const log of receipt.logs) {
      if (!log.address || log.address === POLYGON_MATIC_EVENT_PATH) {
        continue;
      }

      const descriptor = eventsDescriptor.find((desc) => desc.signature === log.topics?.[0]);
      if (descriptor) {
        const decodedParams = decodeLog(
          descriptor.inputs as unknown as AbiParameter[],
          log.data as string,
          (log.topics as string[]).slice(1),
        );
        eventData.push({
          contract: log.address,
          name: descriptor.name || 'UknownEvenet',
          data: cleanWeb3Data(decodedParams),
        });
      }
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

    const index = Number(await store.web3Https!.eth.getBlockNumber());
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
    amount: TokenAmount,
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
      return Number(await store.web3Https!.eth.getTransactionCount(address, status));
    } else {
      return Number(await store.web3Https!.eth.getTransactionCount(address));
    }
  }

  public getAddressByKey(pk: string): string {
    return new Wallet(pk).address;
  }

  /**
   * Fetch transactions for specific addresses starting with specific block until last block
   * @param addresses - array of addresses IN LOWER CASE to fetch transactions (from these addresses and to these addresses)
   * @param startBlock - number of block to start fetching transactions (if empty fetch only for last block)
   * @param lastBlock - number of block to last fetching transactions (if empty fetch only for last block)
   * @param batchSize - block size for asynchronous transaction loading
   * @returns {Promise<{
   *   transactionsByAddress, - found transactions sorted by addresses
   *   lastBlock, - number of last fetched block (can be used to start fetching from this block next time)
   * }>}
   */
  @incrementMethodCall()
  public async getTransactions({
    addresses,
    startBlock,
    lastBlock,
    batchSize = BLOCK_SIZE_TO_FETCH_TRANSACTION,
    timeout,
  }: {
    addresses: string[];
    startBlock?: number;
    lastBlock?: number;
    batchSize?: number;
    timeout?: number;
  }): Promise<BlockchainTransaction> {
    this.checkIfInitialized();

    const blockchainLastBlock = Number(await store.web3Https!.eth.getBlockNumber());
    if (lastBlock) {
      lastBlock = Math.min(lastBlock, blockchainLastBlock);
    } else {
      lastBlock = blockchainLastBlock;
    }

    if (!startBlock) {
      startBlock = Math.max(lastBlock - 1000, 0);
    }

    const transactionsByAddress: { [key: string]: ExtendedTransactionInfo[] } = {};

    const validAddresses = addresses
      .filter((address) => store.web3Https?.utils.isAddress(address))
      .map((address) => address.toLowerCase());

    if (!validAddresses.length) {
      return {
        transactionsByAddress,
        lastBlock,
      };
    }

    validAddresses.forEach((address) => (transactionsByAddress[address] = []));

    while (startBlock <= lastBlock) {
      const batch = new store.web3Https!.BatchRequest();
      const batchLastBlock = Math.min(startBlock + batchSize - 1, lastBlock);

      for (let blockNumber = startBlock; blockNumber <= batchLastBlock; blockNumber++) {
        const hexedBlockNumber = '0x' + blockNumber.toString(16);
        batch
          .add({
            jsonrpc: '2.0',
            method: 'eth_getBlockByNumber',
            params: [hexedBlockNumber, true],
          })
          .catch((err) => this.logger.error(err));
      }
      const blocks: Block[] = await executeBatchAsync<Block>(batch, timeout);

      blocks.forEach((block: Block) => {
        if (!block?.transactions) return;

        block.transactions.forEach((transaction: TransactionInfo | string) => {
          if (typeof transaction === 'string') {
            return;
          }

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
