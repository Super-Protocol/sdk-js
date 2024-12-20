import rootLogger from '../logger.js';
import StaticModel from './StaticModel.js';
import { checkIfActionAccountInitialized, cleanWeb3Data } from '../utils/helper.js';
import { BytesLike, formatBytes32String, parseBytes32String } from 'ethers/lib/utils.js';
import {
  OfferCreatedEvent,
  ValueSlotAddedEvent,
  BlockInfo,
  TransactionOptions,
  OfferInfo,
  OfferType,
  BlockchainId,
  OfferInfoRaw,
} from '../types/index.js';
import Superpro from './Superpro.js';
import TxManager from '../utils/TxManager.js';
import { BlockchainConnector, BlockchainEventsListener } from '../connectors/index.js';
import { EventLog } from 'web3-eth-contract';
import {
  WssSubscriptionOnDataFn,
  WssSubscriptionOnErrorFn,
} from '../connectors/BlockchainEventsListener.js';

class Offers implements StaticModel {
  private static readonly logger = rootLogger.child({ className: 'Offers' });

  public static offers?: BlockchainId[];

  public static get address(): string {
    return Superpro.address;
  }

  /**
   * Function for fetching list of all offers ids
   */
  public static async getAll(): Promise<BlockchainId[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    const count = Number(await contract.methods.getOffersTotalCount().call());
    this.offers = this.offers || [];
    const offersSet = new Set(this.offers);

    for (let offerId = offersSet.size + 1; offerId <= count; ++offerId) {
      const offerType = (
        await contract.methods.getOfferType(offerId).call()
      ).toString() as OfferType;
      if (offerType !== OfferType.TeeOffer) {
        offersSet.add(offerId.toString());
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

    return Number(await contract.methods.getValueOffersSlotsCount().call());
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
    const { restrictions, linkage, offerType, subType, group, ...rest } = offerInfo;
    const offerInfoRaw: OfferInfoRaw = {
      ...rest,
      subtype: subType,
      linkage_DEPRECATED: linkage,
      group_DEPRECATED: group,
      offerType_DEPRECATED: offerType,
    };

    await TxManager.execute(
      contract.methods.createValueOffer(
        providerAuthorityAccount,
        offerType,
        offerInfoRaw,
        restrictions,
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
      offerId?: BlockchainId;
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
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onValueSlotAdded' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (creator && parsedEvent.creator != creator) {
        return;
      }
      callback(
        <string>parsedEvent.creator,
        <BlockchainId>parsedEvent.offerId,
        <BlockchainId>parsedEvent.slotId,
        parseBytes32String(<BytesLike>parsedEvent.externalId),
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
      event: 'ValueSlotAdded',
    });
  }

  /**
   * Function for adding event listeners on onSlotUpdated event in contract
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onSlotUpdated(callback: onSlotUpdatedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onValueSlotUpdated' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <BlockchainId>parsedEvent.offerId,
        <BlockchainId>parsedEvent.slotId,
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
      event: 'ValueSlotUpdated',
    });
  }

  /**
   * Function for adding event listeners on onSlotDeleted event in contract
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onSlotDeleted(callback: onSlotDeletedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onValueSlotDeleted' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <BlockchainId>parsedEvent.offerId,
        <BlockchainId>parsedEvent.slotId,
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
      event: 'ValueSlotDeleted',
    });
  }

  /**
   * Function for adding event listeners on offer created event in offers factory contract
   * @param callback - function for processing created offer
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onCreated(callback: onOfferCreatedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOfferCreated' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <BlockchainId>parsedEvent.offerId,
        <string>parsedEvent.creator,
        parseBytes32String(<BytesLike>parsedEvent.externalId),
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
      event: 'OfferCreated',
    });
  }

  public static onEnabled(callback: onOfferEnabledCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOfferEnabled' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <string>parsedEvent.providerAuth,
        <BlockchainId>parsedEvent.offerId,
        <OfferType>parsedEvent.offerType,
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
      event: 'OfferEnabled',
    });
  }

  public static onDisabled(callback: onOfferDisbledCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOfferDisabled' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <string>parsedEvent.providerAuth,
        <BlockchainId>parsedEvent.offerId,
        <OfferType>parsedEvent.offerType,
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
      event: 'OfferDisabled',
    });
  }
}

// address -> offerId
export type onOfferCreatedCallback = (
  id: BlockchainId,
  creator: string,
  externalId: string,
  block?: BlockInfo,
) => void;
export type onOfferEnabledCallback = (
  providerAuth: string,
  id: BlockchainId,
  offerType: OfferType,
  block?: BlockInfo,
) => void;
export type onOfferDisbledCallback = (
  providerAuth: string,
  id: BlockchainId,
  offerType: OfferType,
  block?: BlockInfo,
) => void;
export type onSlotAddedCallback = (
  creator: string,
  offerId: BlockchainId,
  slotId: BlockchainId,
  externalId: string,
  block?: BlockInfo,
) => void;
export type onSlotUpdatedCallback = (
  offerId: BlockchainId,
  slotId: BlockchainId,
  block?: BlockInfo,
) => void;
export type onSlotDeletedCallback = (
  offerId: BlockchainId,
  slotId: BlockchainId,
  block?: BlockInfo,
) => void;

export default Offers;
