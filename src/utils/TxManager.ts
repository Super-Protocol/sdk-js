import { TransactionReceipt } from 'web3';
import NonceTracker from './NonceTracker.js';
import rootLogger from '../logger.js';
import store from '../store.js';
import {
  TransactionOptions,
  DryRunError,
  TransactionDataOptions,
  BlockchainError,
  TransactionOptionsRequired,
} from '../types/index.js';
import {
  checkForUsingExternalTxManager,
  checkIfActionAccountInitialized,
  createTransactionOptions,
  multiplyBigIntByNumber,
} from './helper.js';
import Superpro from '../staticModels/Superpro.js';
import { AMOY_TX_COST_LIMIT, defaultGasLimit, POLYGON_AMOY_CHAIN_ID } from '../constants.js';
import lodash from 'lodash';
import Web3 from 'web3';
import Bottleneck from 'bottleneck';
import { NonPayableMethodObject, NonPayableTxOptions } from 'web3-eth-contract';

interface EvmError extends Error {
  data: {
    message?: string;
  };
}

class Web3TransactionError extends Error {
  public readonly originalError: unknown;
  constructor(originalError: unknown, message: string) {
    super(message);
    this.name = 'Web3TransactionError';
    this.originalError = originalError;
  }
}

export class Web3TransactionRevertedByEvmError extends Web3TransactionError {
  constructor(originalError: unknown, message: string) {
    super(originalError, message);
    this.name = 'Web3TransactionRevertedByEvmError';
  }
}

type PublishTransactionOptions = Required<TransactionOptions> & { useExternalTxManager: boolean };

class TxManager {
  private static web3: Web3;
  private static logger = rootLogger.child({ className: 'TxManager' });
  private static nonceTrackers: { [address: string]: NonceTracker } = {};
  private static queues: { [address: string]: Bottleneck } = {};
  public static init(web3: Web3): void {
    this.web3 = web3;
  }

  private static checkIfInitialized(): void {
    if (!this.web3) {
      throw Error('TxManager should be initialized before using.');
    }
  }

  public static async initAccount(address: string): Promise<void> {
    if (this.nonceTrackers[address]) return;
    this.nonceTrackers[address] = new NonceTracker(this.web3, address);
    await this.nonceTrackers[address].initAccount();
  }

  public static execute(
    transaction: NonPayableMethodObject,
    transactionOptions?: TransactionOptions,
    to: string = Superpro.address,
  ): Promise<TransactionReceipt> {
    const txData: TransactionDataOptions = {
      to,
      data: transaction.encodeABI(),
    };

    return TxManager.publishTransaction(txData, transactionOptions, transaction);
  }

  public static async publishTransaction(
    txData: TransactionDataOptions,
    transactionOptions?: TransactionOptions,
    transactionCall?: NonPayableMethodObject,
  ): Promise<TransactionReceipt> {
    this.checkIfInitialized();
    checkIfActionAccountInitialized(transactionOptions);

    const txOptions = await createTransactionOptions({ ...transactionOptions });

    if (!txOptions.from) {
      throw Error(
        'From account is undefined. You should pass it to transactionOptions or init action account.',
      );
    }

    const publishTxOptions: PublishTransactionOptions = {
      ...(txOptions as TransactionOptionsRequired),
      web3: transactionOptions?.web3 || this.web3,
      useExternalTxManager: checkForUsingExternalTxManager(transactionOptions),
    };

    if (!this.queues[publishTxOptions.from]) {
      this.queues[publishTxOptions.from] = new Bottleneck({
        maxConcurrent: store.txConcurrency,
        minTime: store.txIntervalMs,
      });
    }

    return this.queues[publishTxOptions.from].schedule(() =>
      TxManager._publishTransaction(txData, publishTxOptions, transactionCall),
    );
  }

  public static async dryRun<SpecialOutput = unknown>(
    transaction: NonPayableMethodObject,
    transactionOptions?: TransactionOptions,
  ): Promise<SpecialOutput> {
    const from = transactionOptions?.from ?? store.actionAccount;

    try {
      return await transaction.call({ from });
    } catch (e) {
      (e as DryRunError).txErrorMsg = (e as EvmError).data.message || 'Error text is undefined';
      throw e;
    }
  }

  private static async _publishTransaction(
    txData: TransactionDataOptions,
    transactionOptions: PublishTransactionOptions,
    transactionCall?: NonPayableMethodObject,
  ): Promise<TransactionReceipt> {
    const { from, gas, gasPrice, gasPriceMultiplier, web3 } = transactionOptions;

    txData = {
      ...txData,
      from,
      gas,
      gasPrice,
      gasPriceMultiplier,
    };

    let estimatedGas;
    if (transactionCall) {
      try {
        estimatedGas = await transactionCall.estimateGas(txData as NonPayableTxOptions);
      } catch (e) {
        TxManager.logger.debug({ error: e }, 'Fail to calculate estimated gas');
        estimatedGas = defaultGasLimit;
      }
    } else {
      try {
        estimatedGas = await store.web3Https!.eth.estimateGas(txData);
      } catch (e) {
        TxManager.logger.debug({ error: e }, 'Fail to calculate estimated gas');
        estimatedGas = defaultGasLimit;
      }
    }
    txData.gas = multiplyBigIntByNumber(estimatedGas, store.gasLimitMultiplier);
    // defaultGasLimit is max gas limit
    txData.gas =
      txData.gas < defaultGasLimit && txData.gas !== BigInt(0) ? txData.gas : defaultGasLimit;

    if (transactionOptions.gas) {
      if (transactionOptions.gas < estimatedGas) {
        TxManager.logger.warn(
          {
            estimated: estimatedGas,
            specified: transactionOptions.gas,
          },
          'Overriding gas is lower than estimated',
        );
      }
      txData.gas = transactionOptions.gas;
    }

    if (store.chainId === POLYGON_AMOY_CHAIN_ID) {
      const maxGasPrice = AMOY_TX_COST_LIMIT / BigInt(txData.gas);
      if (maxGasPrice < txData.gasPrice!) {
        txData.gasPrice = maxGasPrice;
      }
    } else {
      txData.gasPrice = multiplyBigIntByNumber(txData.gasPrice!, store.gasPriceMultiplier);
    }

    let nonceTracker;
    // TODO: Consider a better way to organize different strategies for publishing transactions.
    if (!transactionOptions.useExternalTxManager && this.nonceTrackers[transactionOptions.from]) {
      nonceTracker = this.nonceTrackers[transactionOptions.from!];
      await nonceTracker.onTransactionStartPublishing();
      txData.nonce = nonceTracker.consumeNonce();
    }
    const signingKey = store.keys[transactionOptions.from!];
    try {
      let transactionResultData;
      if (signingKey) {
        const signed = await web3!.eth.accounts.signTransaction(txData, signingKey);
        if (!signed.rawTransaction) {
          throw new Error('Failed to sign transaction');
        }

        TxManager.logger.debug(
          {
            txHash: signed.transactionHash,
            txData: lodash.omit(txData, ['data']),
          },
          'Publishing signed transaction',
        );

        transactionResultData = await web3!.eth.sendSignedTransaction(signed.rawTransaction);

        TxManager.logger.debug(
          {
            txHash: signed.transactionHash,
            txBlockNumber: transactionResultData.blockNumber,
            txGasUsed: transactionResultData.gasUsed,
          },
          'Transaction result',
        );
      } else {
        TxManager.logger.debug(
          {
            txData: lodash.omit(txData, ['data']),
          },
          'Publishing unsigned transaction',
        );

        transactionResultData = await web3!.eth.sendTransaction(txData);
      }

      if (nonceTracker) nonceTracker.onTransactionPublished(txData.nonce!);

      return transactionResultData;
    } catch (e: unknown) {
      const message = 'Error during transaction execution';
      TxManager.logger.error(e, message);
      if (nonceTracker) await nonceTracker.onTransactionError();
      if ((e as BlockchainError).message?.includes('Transaction has been reverted by the EVM')) {
        throw new Web3TransactionRevertedByEvmError(e, message);
      } else {
        throw new Web3TransactionError(e, message);
      }
    }
  }
}

export default TxManager;
