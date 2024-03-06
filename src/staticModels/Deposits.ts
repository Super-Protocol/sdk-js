import rootLogger from '../logger.js';
import Superpro from './Superpro.js';
import TxManager from '../utils/TxManager.js';
import {
  checkIfActionAccountInitialized,
  cleanWeb3Data,
  convertBigIntToString,
  incrementMethodCall,
} from '../utils/helper.js';
import { BlockchainConnector, BlockchainEventsListener } from '../connectors/index.js';
import { DepositInfo, BlockInfo, TransactionOptions, TokenAmount } from '../types/index.js';
import { EventLog } from 'web3-eth-contract';

class Deposits {
  private static readonly logger = rootLogger.child({ className: 'Deposits' });

  public static get address(): string {
    return Superpro.address;
  }

  /**
   * Function for fetching deposit info
   * @param depositOwner - Deposit owner
   */
  public static async getDepositInfo(depositOwner: string): Promise<DepositInfo> {
    const contract = BlockchainConnector.getInstance().getContract();

    return cleanWeb3Data(await contract.methods.getDepositInfo(depositOwner).call());
  }

  /**
   * Function for fetching amount of locked tokens
   * @param depositOwner - Deposit owner
   */
  public static async getLockedTokensAmount(depositOwner: string): Promise<TokenAmount> {
    const contract = BlockchainConnector.getInstance().getContract();

    return convertBigIntToString(await contract.methods.getLockedTokensAmount(depositOwner).call());
  }

  /**
   * Function for replenish deposit
   * @param amount - replenish amount
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   * @returns {Promise<void>} - Does not return id of created order!
   */
  @incrementMethodCall()
  public static async replenish(
    amount: TokenAmount,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(contract.methods.replenish(amount), transactionOptions);
  }

  /**
   * Function for replenish deposit of given account
   * @param beneficiary - account
   * @param amount - replenish amount
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   * @returns {Promise<void>} - Does not return id of created order!
   */
  @incrementMethodCall()
  public static async replenishFor(
    beneficiary: string,
    amount: TokenAmount,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(contract.methods.replenishFor(beneficiary, amount), transactionOptions);
  }

  /**
   * Function for withdraw deposit
   * @param amount - withdraw amount
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   * @returns {Promise<void>} - Does not return id of created order!
   */
  @incrementMethodCall()
  public static async withdraw(
    amount: TokenAmount,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(contract.methods.withdraw(amount), transactionOptions);
  }

  /**
   * Function for adding event listeners on DepositReplenished event in contract
   * @param owner - owner address
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onDepositReplenished(
    callback: onDepositReplenishedCallback,
    owner?: string,
  ): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onDepositReplenished' });

    const subscription = contract.events.DepositReplenished();
    subscription.on('data', (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (owner && event.returnValues.owner != owner) {
        return;
      }
      callback(
        <string>parsedEvent.owner,
        <TokenAmount>parsedEvent.amount,
        <TokenAmount>parsedEvent.totalLocked,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    });
    subscription.on('error', (error: Error) => {
      logger.warn(error);
    });

    return () => subscription.unsubscribe();
  }

  /**
   * Function for adding event listeners on DepositWithdrawn event in contract
   * @param owner - owner address
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onDepositWithdrawn(
    callback: onDepositWithdrawnCallback,
    owner?: string,
  ): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onDepositWithdrawn' });

    const subscription = contract.events.DepositWithdrawn();
    subscription.on('data', (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (owner && parsedEvent.owner != owner) {
        return;
      }
      callback(
        <string>parsedEvent.owner,
        <TokenAmount>parsedEvent.amount,
        <TokenAmount>parsedEvent.totalLocked,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    });
    subscription.on('error', (error: Error) => {
      logger.warn(error);
    });

    return () => subscription.unsubscribe();
  }

  /**
   * Function for adding event listeners on DepositPartLocked event in contract
   * @param owner - owner address
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onDepositPartLocked(
    callback: onDepositPartLockedCallback,
    owner?: string,
  ): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onDepositPartLocked' });

    const subscription = contract.events.DepositPartLocked();
    subscription.on('data', (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (owner && parsedEvent.owner != owner) {
        return;
      }
      callback(
        <string>parsedEvent.owner,
        <TokenAmount>parsedEvent.amount,
        <TokenAmount>parsedEvent.totalLocked,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    });
    subscription.on('error', (error: Error) => {
      logger.warn(error);
    });

    return () => subscription.unsubscribe();
  }

  /**
   * Function for adding event listeners on DepositPartUnlocked event in contract
   * @param owner - owner address
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onDepositPartUnlocked(
    callback: onDepositPartUnlockedCallback,
    owner?: string,
  ): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onDepositPartUnlocked' });

    const subscription = contract.events.DepositPartUnlocked();
    subscription.on('data', (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (owner && parsedEvent.owner != owner) {
        return;
      }
      callback(
        <string>parsedEvent.owner,
        <TokenAmount>parsedEvent.amount,
        <TokenAmount>parsedEvent.totalLocked,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    });
    subscription.on('error', (error: Error) => {
      logger.warn(error);
    });

    return () => subscription.unsubscribe();
  }
}

export type onDepositReplenishedCallback = (
  owner: string,
  amount: TokenAmount,
  totalLocked: TokenAmount,
  block?: BlockInfo,
) => void;
export type onDepositWithdrawnCallback = (
  owner: string,
  amount: TokenAmount,
  totalLocked: TokenAmount,
  block?: BlockInfo,
) => void;
export type onDepositPartLockedCallback = (
  owner: string,
  amount: TokenAmount,
  totalLocked: TokenAmount,
  block?: BlockInfo,
) => void;
export type onDepositPartUnlockedCallback = (
  owner: string,
  amount: TokenAmount,
  totalLocked: TokenAmount,
  block?: BlockInfo,
) => void;

export default Deposits;
