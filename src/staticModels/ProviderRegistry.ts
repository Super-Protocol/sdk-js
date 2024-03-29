import rootLogger from '../logger';
import { checkIfActionAccountInitialized, cleanWeb3Data } from '../utils/helper';
import { ProviderInfo, BlockInfo, TransactionOptions, TokenAmount } from '../types';
import { EventLog } from 'web3-eth-contract';
import { BlockchainConnector, BlockchainEventsListener } from '../connectors';
import TxManager from '../utils/TxManager';

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
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onProviderRegistered' });

    const subscription = contract.events.ProviderRegistered();
    subscription.on('data', (event: EventLog): void => {
      callback(
        <string>event.returnValues.auth,
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
   * Function for adding event listeners on provider modified event in provider registry
   * @param callback - function for processing modified provider
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onProviderModified(callback: onProviderModifiedCallback): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onProviderModified' });

    const subscription = contract.events.ProviderModified();
    subscription.on('data', (event: EventLog): void => {
      callback(
        <string>event.returnValues.auth,
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
   * Function for adding event listeners on provider violation rate incremented event in provider registry
   * @param callback - function for processing new violation rate
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onProviderViolationRateIncremented(
    callback: onProviderViolationRateIncrementedCallback,
  ): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onProviderViolationRateIncremented' });

    const subscription = contract.events.ProviderViolationRateIncremented();
    subscription.on('data', (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <string>parsedEvent.auth,
        <string>parsedEvent.newViolationRate,
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
   * Function for adding event listeners on provider security deposit refilled event in provider registry
   * @param callback - function for processing refilled security deposit
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onProviderSecurityDepoRefilled(
    callback: onProviderSecurityDepoRefilledCallback,
  ): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onProviderSecurityDepoRefilled' });

    const subscription = contract.events.ProviderSecurityDepoRefilled();
    subscription.on('data', (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <string>parsedEvent.auth,
        <TokenAmount>parsedEvent.amount,
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
   * Function for adding event listeners on provider security deposit unlocked event in provider registry
   * @param callback - function for processing unlocked security deposit
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onProviderSecurityDepoUnlocked(
    callback: onProviderSecurityDepoUnlockedCallback,
  ): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onProviderSecurityDepoUnlocked' });

    const subscription = contract.events.ProviderSecurityDepoUnlocked();
    subscription.on('data', (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <string>parsedEvent.auth,
        <TokenAmount>parsedEvent.amount,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>parsedEvent.blockHash,
        },
      );
    });
    subscription.on('error', (error: Error) => {
      logger.warn(error);
    });

    return () => subscription.unsubscribe();
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
