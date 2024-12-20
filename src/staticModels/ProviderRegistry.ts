import rootLogger from '../logger.js';
import { checkIfActionAccountInitialized, cleanWeb3Data } from '../utils/helper.js';
import { ProviderInfo, BlockInfo, TransactionOptions, TokenAmount } from '../types/index.js';
import { EventLog } from 'web3-eth-contract';
import { BlockchainConnector, BlockchainEventsListener } from '../connectors/index.js';
import TxManager from '../utils/TxManager.js';
import {
  WssSubscriptionOnDataFn,
  WssSubscriptionOnErrorFn,
} from '../connectors/BlockchainEventsListener.js';

class ProviderRegistry {
  private static readonly logger = rootLogger.child({ className: 'ProviderRegistry' });

  public static providers?: string[];

  /**
   * Function for fetching list of all providers addresses
   */
  public static async getAllProviders(): Promise<string[]> {
    const contract = BlockchainConnector.getInstance().getContract();
    this.providers = await contract.methods.getProvidersAuths().call();

    return this.providers;
  }

  public static isProviderRegistered(providerAuthority: string): Promise<boolean> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods.isProviderRegistered(providerAuthority).call();
  }

  /**
   * Refills security provider deposit
   * Call this function with provider authority account (in transactionOptions)
   * @param amount - amount of additional tokens
   * @param recipient - target provider authority address
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public static async refillSecurityDepositFor(
    amount: TokenAmount,
    recipient: string,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      contract.methods.refillProviderSecurityDepoFor(recipient, amount),
      transactionOptions,
    );
  }

  /**
   * Reg new provider
   * @param providerInfo - data of new provider
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public static async registerProvider(
    providerInfo: ProviderInfo,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(contract.methods.registerProvider(providerInfo), transactionOptions);
  }

  /**
   * Refills security deposit for provider
   * Call this function with provider authority account (in transactionOptions)
   * @param amount - amount of additional tokens
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public static async refillSecurityDeposit(
    amount: TokenAmount,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      contract.methods.refillProviderSecurityDepo(amount),
      transactionOptions,
    );
  }

  /**
   * Return security deposit for provider
   * Call this function with provider authority account (in transactionOptions)
   * @param amount - amount of tokens to return
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public static async returnSecurityDeposit(
    amount: TokenAmount,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      contract.methods.returnProviderSecurityDepo(amount),
      transactionOptions,
    );
  }

  /**
   * Function for adding event listeners on provider registered event in provider registry
   * @param callback - function for processing new provider
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onProviderRegistered(callback: onProviderRegisteredCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onProviderRegistered' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      callback(
        <string>event.returnValues.auth,
        <BlockInfo>{
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
      event: 'ProviderRegistered',
    });
  }

  /**
   * Function for adding event listeners on provider modified event in provider registry
   * @param callback - function for processing modified provider
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onProviderModified(callback: onProviderModifiedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onProviderModified' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      callback(
        <string>event.returnValues.auth,
        <BlockInfo>{
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
      event: 'ProviderModified',
    });
  }

  /**
   * Function for adding event listeners on provider violation rate incremented event in provider registry
   * @param callback - function for processing new violation rate
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onProviderViolationRateIncremented(
    callback: onProviderViolationRateIncrementedCallback,
  ): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onProviderViolationRateIncremented' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <string>parsedEvent.auth,
        <string>parsedEvent.newViolationRate,
        <BlockInfo>{
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
      event: 'ProviderViolationRateIncremented',
    });
  }

  /**
   * Function for adding event listeners on provider security deposit refilled event in provider registry
   * @param callback - function for processing refilled security deposit
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onProviderSecurityDepoRefilled(
    callback: onProviderSecurityDepoRefilledCallback,
  ): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onProviderSecurityDepoRefilled' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <string>parsedEvent.auth,
        <TokenAmount>parsedEvent.amount,
        <BlockInfo>{
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
      event: 'ProviderSecurityDepoRefilled',
    });
  }

  /**
   * Function for adding event listeners on provider security deposit unlocked event in provider registry
   * @param callback - function for processing unlocked security deposit
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onProviderSecurityDepoUnlocked(
    callback: onProviderSecurityDepoUnlockedCallback,
  ): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onProviderSecurityDepoUnlocked' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <string>parsedEvent.auth,
        <TokenAmount>parsedEvent.amount,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>parsedEvent.blockHash,
        },
      );
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'ProviderSecurityDepoUnlocked',
    });
  }
}

// address -> AuthorityAccount
export type onProviderRegisteredCallback = (address: string, block?: BlockInfo) => void;
export type onProviderModifiedCallback = (address: string, block?: BlockInfo) => void;
export type onProviderSecurityDepoRefilledCallback = (
  address: string,
  amount: TokenAmount,
  block?: BlockInfo,
) => void;
export type onProviderSecurityDepoUnlockedCallback = (
  address: string,
  amount: TokenAmount,
  block?: BlockInfo,
) => void;
export type onProviderViolationRateIncrementedCallback = (
  address: string,
  newViolationRate: bigint | string,
  block?: BlockInfo,
) => void;

export default ProviderRegistry;
