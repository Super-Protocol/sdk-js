import rootLogger from '../logger';
import Superpro from './Superpro';
import TxManager from '../utils/TxManager';
import { checkIfActionAccountInitialized, incrementMethodCall } from '../utils/helper';
import { BlockchainConnector, BlockchainEventsListener } from '../connectors';
import { DepositInfo, BlockInfo, TransactionOptions } from '../types';
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
  public static getDepositInfo(depositOwner: string): Promise<DepositInfo> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods.getDepositInfo(depositOwner).call();
  }

  /**
   * Function for fetching amount of locked tokens
   * @param depositOwner - Deposit owner
   */
  public static getLockedTokensAmount(depositOwner: string): Promise<bigint> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods.getLockedTokensAmount(depositOwner).call();
  }

  /**
   * Function for replenish deposit
   * @param amount - replenish amount
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   * @returns {Promise<void>} - Does not return id of created order!
   */
  @incrementMethodCall()
  public static async replenish(
    amount: bigint,
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
    amount: bigint,
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
    amount: bigint,
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
      if (owner && event.returnValues.owner != owner) {
        return;
      }
      callback(
        <string>event.returnValues.owner,
        <bigint>event.returnValues.amount,
        <bigint>event.returnValues.totalLocked,
        <BlockInfo>{
          index: <bigint>event.blockNumber,
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
      if (owner && event.returnValues.owner != owner) {
        return;
      }
      callback(
        <string>event.returnValues.owner,
        <bigint>event.returnValues.amount,
        <bigint>event.returnValues.totalLocked,
        <BlockInfo>{
          index: <bigint>event.blockNumber,
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
      if (owner && event.returnValues.owner != owner) {
        return;
      }
      callback(
        <string>event.returnValues.owner,
        <bigint>event.returnValues.amount,
        <bigint>event.returnValues.totalLocked,
        <BlockInfo>{
          index: <bigint>event.blockNumber,
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
      if (owner && event.returnValues.owner != owner) {
        return;
      }
      callback(
        <string>event.returnValues.owner,
        <bigint>event.returnValues.amount,
        <bigint>event.returnValues.totalLocked,
        <BlockInfo>{
          index: <bigint>event.blockNumber,
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
  amount: bigint,
  totalLocked: bigint,
  block?: BlockInfo,
) => void;
export type onDepositWithdrawnCallback = (
  owner: string,
  amount: bigint,
  totalLocked: bigint,
  block?: BlockInfo,
) => void;
export type onDepositPartLockedCallback = (
  owner: string,
  amount: bigint,
  totalLocked: bigint,
  block?: BlockInfo,
) => void;
export type onDepositPartUnlockedCallback = (
  owner: string,
  amount: bigint,
  totalLocked: bigint,
  block?: BlockInfo,
) => void;

export default Deposits;
