import rootLogger from '../logger';
import StaticModel from './StaticModel';
import { checkIfActionAccountInitialized } from '../utils/helper';
import { BytesLike, formatBytes32String, parseBytes32String } from 'ethers/lib/utils';
import {
  OfferCreatedEvent,
  ValueSlotAddedEvent,
  BlockInfo,
  TransactionOptions,
  OfferInfo,
  OfferType,
} from '../types';
import Superpro from './Superpro';
import TxManager from '../utils/TxManager';
import { BlockchainConnector, BlockchainEventsListener } from '../connectors';
import { EventLog } from 'web3-eth-contract';

class Offers implements StaticModel {
  private static readonly logger = rootLogger.child({ className: 'Offers' });

  public static offers?: bigint[];

  public static get address(): string {
    return Superpro.address;
  }

  /**
   * Function for fetching list of all offers ids
   */
  public static async getAll(): Promise<bigint[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    const count = Number(await contract.methods.getOffersTotalCount().call());
    this.offers = this.offers || [];
    const offersSet = new Set(this.offers);

    for (let offerId = offersSet.size + 1; offerId <= count; ++offerId) {
      const offerType = (await contract.methods.getOfferType(offerId).call()) as OfferType;
      if (offerType !== OfferType.TeeOffer) {
        offersSet.add(BigInt(offerId));
      }
    }
    this.offers = Array.from(offersSet);

    return this.offers;
  }

  /**
   * Function for fetching total count of value offer slots
   */
  public static async getSlotsCount(): Promise<number> {
    const contract = BlockchainConnector.getInstance().getContract();

    return +(await contract.methods.getValueOffersSlotsCount().call());
  }

  /**
   * Creates new offer
   * @param providerAuthorityAccount - address of authority account of provider
   * @param offerInfo - data of new offer
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public static async create(
    providerAuthorityAccount: string,
    offerInfo: OfferInfo,
    externalId = 'default',
    enabled = true,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    const formattedExternalId = formatBytes32String(externalId);
    await TxManager.execute(
      contract.methods.createValueOffer(
        providerAuthorityAccount,
        offerInfo,
        formattedExternalId,
        enabled,
      ),
      transactionOptions,
    );
  }

  public static async getByExternalId(
    filter: {
      externalId: string;
      creator?: string;
    },
    fromBlock?: number | string,
    toBlock?: number | string,
  ): Promise<OfferCreatedEvent | null> {
    const founded = await StaticModel.findItemsById('OfferCreated', filter, fromBlock, toBlock);

    if (!founded) return null;

    return founded as OfferCreatedEvent;
  }

  public static async getSlotByExternalId(
    filter: {
      externalId: string;
      creator?: string;
      offerId?: bigint;
    },
    fromBlock?: number | string,
    toBlock?: number | string,
  ): Promise<ValueSlotAddedEvent | null> {
    const found = await StaticModel.findItemsById('ValueSlotAdded', filter, fromBlock, toBlock);

    if (!found) return null;

    return found as ValueSlotAddedEvent;
  }

  /**
   * Function for adding event listeners on onSlotAdded event in contract
   * @param creator - creator address
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onSlotAdded(callback: onSlotAddedCallback, creator?: string): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onValueSlotAdded' });

    const subscription = contract.events.ValueSlotAdded();
    subscription.on('data', (event: EventLog): void => {
      if (creator && event.returnValues.creator != creator) {
        return;
      }
      callback(
        <string>event.returnValues.creator,
        <bigint>event.returnValues.offerId,
        <bigint>event.returnValues.slotId,
        parseBytes32String(<BytesLike>event.returnValues.externalId),
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
   * Function for adding event listeners on onSlotUpdated event in contract
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onSlotUpdated(callback: onSlotUpdatedCallback): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onValueSlotUpdated' });

    const subscription = contract.events.ValueSlotUpdated();
    subscription.on('data', (event: EventLog): void => {
      callback(
        <bigint>event.returnValues.offerId,
        <bigint>event.returnValues.slotId,
        <BlockInfo>{
          index: <bigint>event.blockNumber,
          hash: <string>event.blockHash,
        },
      );
    });
    subscription.on('error', (error: Error): void => {
      logger.warn(error);
    });

    return () => subscription.unsubscribe();
  }

  /**
   * Function for adding event listeners on onSlotDeleted event in contract
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onSlotDeleted(callback: onSlotDeletedCallback): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onValueSlotDeleted' });

    const subscription = contract.events.ValueSlotDeleted();
    subscription.on('data', (event: EventLog): void => {
      callback(
        <bigint>event.returnValues.offerId,
        <bigint>event.returnValues.slotId,
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
   * Function for adding event listeners on offer created event in offers factory contract
   * @param callback - function for processing created offer
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onCreated(callback: onOfferCreatedCallback): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onOfferCreated' });

    const subscription = contract.events.OfferCreated();
    subscription.on('data', (event: EventLog): void => {
      callback(
        <bigint>event.returnValues.offerId,
        <string>event.returnValues.creator,
        parseBytes32String(<BytesLike>event.returnValues.externalId),
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

  public static onEnabled(callback: onOfferEnabledCallback): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onOfferEnabled' });

    const subscription = contract.events.OfferEnabled();
    subscription.on('data', (event: EventLog): void => {
      callback(
        <string>event.returnValues.providerAuth,
        <bigint>event.returnValues.offerId,
        <OfferType>event.returnValues.offerType,
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

  public static onDisabled(callback: onOfferDisbledCallback): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onOfferDisabled' });

    const subscription = contract.events.OfferDisabled();
    subscription.on('data', (event: EventLog): void => {
      callback(
        <string>event.returnValues.providerAuth,
        <bigint>event.returnValues.offerId,
        <OfferType>event.returnValues.offerType,
        <BlockInfo>{
          index: <bigint>event.blockNumber,
          hash: <string>event.blockHash,
        },
      );
    });
    subscription.on('error', (error: Error): void => {
      logger.warn(error);
    });

    return () => subscription.unsubscribe();
  }
}

// address -> offerId
export type onOfferCreatedCallback = (
  id: bigint,
  creator: string,
  externalId: string,
  block?: BlockInfo,
) => void;
export type onOfferEnabledCallback = (
  providerAuth: string,
  id: bigint,
  offerType: OfferType,
  block?: BlockInfo,
) => void;
export type onOfferDisbledCallback = (
  providerAuth: string,
  id: bigint,
  offerType: OfferType,
  block?: BlockInfo,
) => void;
export type onSlotAddedCallback = (
  creator: string,
  offerId: bigint,
  slotId: bigint,
  externalId: string,
  block?: BlockInfo,
) => void;
export type onSlotUpdatedCallback = (offerId: bigint, slotId: bigint, block?: BlockInfo) => void;
export type onSlotDeletedCallback = (offerId: bigint, slotId: bigint, block?: BlockInfo) => void;

export default Offers;
