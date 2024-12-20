import { Contract, Transaction } from 'web3';
import rootLogger from '../logger.js';
import { abi } from '../contracts/abi.js';
import store from '../store.js';
import {
  checkIfActionAccountInitialized,
  cleanWeb3Data,
  convertBigIntToString,
} from '../utils/helper.js';
import { TransactionOptions, BlockInfo, TokenAmount } from '../types/index.js';
import { EventLog } from 'web3-eth-contract';
import TxManager from '../utils/TxManager.js';
import { BlockchainEventsListener } from '../connectors/index.js';
import {
  WssSubscriptionOnDataFn,
  WssSubscriptionOnErrorFn,
} from '../connectors/BlockchainEventsListener.js';

class SuperproToken {
  private static _addressHttps: string;
  private static _addressWss: string;
  private static contractHttps?: Contract<typeof abi>;
  private static readonly logger = rootLogger.child({ className: 'SuperproToken' });

  public static get addressHttps(): string {
    return SuperproToken._addressHttps;
  }

  public static set addressHttps(newAddress: string) {
    SuperproToken._addressHttps = newAddress;
    SuperproToken.contractHttps = new store.web3Https!.eth.Contract(abi, newAddress, {
      provider: store.web3Https!.currentProvider,
      config: { contractDataInputFill: 'data' },
    });
  }

  public static get addressWss(): string {
    return SuperproToken._addressWss;
  }

  public static set addressWss(newAddress: string) {
    SuperproToken._addressWss = newAddress;
  }

  /**
   * Checks if contract has been initialized, if not - initialize contract
   */
  private static checkInit(): Contract<typeof abi> {
    if (!SuperproToken.contractHttps) {
      throw Error(`SuperproToken must be initialized before it can be used`);
    }

    return SuperproToken.contractHttps!;
  }

  /**
   * Fetching balance of SuperProtocol tokens on address
   */
  public static async balanceOf(address: string): Promise<TokenAmount> {
    this.checkInit();

    return convertBigIntToString(await this.contractHttps!.methods.balanceOf(address).call());
  }

  /**
   * Fetching allowance of SuperProtocol tokens on address
   */
  public static async allowance(from: string, to: string): Promise<TokenAmount> {
    this.checkInit();

    return convertBigIntToString(await this.contractHttps!.methods.allowance(from, to).call());
  }

  /**
   * Transfers specific amount of SP tokens to specific address
   * @param to - address to revive tokens
   * @param amount - amount of tokens to transfer
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public static async transfer(
    to: string,
    amount: TokenAmount,
    transactionOptions?: TransactionOptions,
    checkTxBeforeSend = false,
  ): Promise<Transaction> {
    const contract = this.checkInit();
    checkIfActionAccountInitialized(transactionOptions);

    if (checkTxBeforeSend) {
      await TxManager.dryRun(contract.methods.transfer(to, amount), transactionOptions);
    }

    const receipt = await TxManager.execute(
      contract.methods.transfer(to, amount),
      transactionOptions,
      SuperproToken.addressHttps,
    );

    return store.web3Https!.eth.getTransaction(receipt.transactionHash);
  }

  /**
   * Approve tokens for specific address
   * @param address - address for approval
   * @param amount - number of tokens to be approved
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public static async approve(
    address: string,
    amount: TokenAmount,
    transactionOptions?: TransactionOptions,
    checkTxBeforeSend = false,
  ): Promise<void> {
    const contract = this.checkInit();
    checkIfActionAccountInitialized(transactionOptions);

    if (checkTxBeforeSend) {
      await TxManager.dryRun(contract.methods.approve(address, amount), transactionOptions);
    }

    await TxManager.execute(
      contract.methods.approve(address, amount),
      transactionOptions,
      SuperproToken.addressHttps,
    );
  }

  public static onTokenApprove(
    callback: onTokenApproveCallback,
    owner?: string,
    spender?: string,
  ): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onTokenApprove' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (owner && parsedEvent.owner != owner) {
        return;
      }
      if (spender && parsedEvent.spender != spender) {
        return;
      }
      callback(
        <string>parsedEvent.owner,
        <string>parsedEvent.spender,
        <TokenAmount>parsedEvent.value,
        {
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'Approval',
    });
  }

  public static onTokenTransfer(
    callback: onTokenTransferCallback,
    from?: string,
    to?: string,
  ): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onTokenTransfer' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (from && parsedEvent.from != from) {
        return;
      }
      if (to && parsedEvent.to != to) {
        return;
      }
      callback(<string>parsedEvent.from, <string>parsedEvent.to, <TokenAmount>parsedEvent.value, {
        index: Number(event.blockNumber),
        hash: <string>event.blockHash,
      });
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'Transfer',
    });
  }
}

export type onTokenApproveCallback = (
  owner: string,
  spender: string,
  value: TokenAmount,
  block?: BlockInfo,
) => void;
export type onTokenTransferCallback = (
  from: string,
  to: string,
  value: TokenAmount,
  block?: BlockInfo,
) => void;

export default SuperproToken;
