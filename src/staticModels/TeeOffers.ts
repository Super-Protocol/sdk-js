import rootLogger from '../logger';
import { checkIfActionAccountInitialized, formatTeeOfferOption, packDeviceId } from '../utils/helper';
import { BytesLike, formatBytes32String, parseBytes32String } from 'ethers/lib/utils';
import {
  BlockInfo,
  TransactionOptions,
  HardwareInfo,
  TeeOfferInfo,
  OfferType,
  OfferCreatedEvent,
  OptionAddedEvent,
  TeeSlotAddedEvent,
  TeeOfferOption,
} from '../types';
import { BlockchainConnector, BlockchainEventsListener } from '../connectors';
import Superpro from './Superpro';
import TxManager from '../utils/TxManager';
import { EventLog } from 'web3-eth-contract';
import StaticModel from './StaticModel';

class TeeOffers {
  private static cpuDenominator?: number;

  private static readonly logger = rootLogger.child({ className: 'TeeOffers' });

  public static teeOffers?: bigint[];

  public static get address(): string {
    return Superpro.address;
  }

  public static async packHardwareInfo(hw: HardwareInfo): Promise<HardwareInfo> {
    hw.slotInfo.cpuCores *= await TeeOffers.getDenominator();

    return hw;
  }

  public static async unpackHardwareInfo(hw: HardwareInfo): Promise<HardwareInfo> {
    hw.slotInfo.cpuCores /= await TeeOffers.getDenominator();

    return hw;
  }

  public static async getDenominator(): Promise<number> {
    if (!this.cpuDenominator) {
      const contract = BlockchainConnector.getInstance().getContract();
      this.cpuDenominator = Number(await contract.methods.getCpuDenominator().call());
    }

    return this.cpuDenominator;
  }
  /**
   * Function for fetching list of all TEE offers addresses
   */
  public static async getAll(): Promise<bigint[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    const count = Number(await contract.methods.getOffersTotalCount().call());
    this.teeOffers = this.teeOffers || [];
    const teeOfffersSet = new Set(this.teeOffers);

    for (let offerId = teeOfffersSet.size + 1; offerId <= count; ++offerId) {
      const offerType = (await contract.methods.getOfferType(offerId).call()) as OfferType;
      if (offerType === OfferType.TeeOffer) {
        teeOfffersSet.add(BigInt(offerId));
      }
    }
    this.teeOffers = Array.from(teeOfffersSet);

    return this.teeOffers;
  }

  /**
   * Creates new TEE offer
   * @param providerAuthorityAccount - address of authority account of provider
   * @param teeOfferInfo - data of new TEE offer
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public static async create(
    providerAuthorityAccount: string,
    teeOfferInfo: TeeOfferInfo,
    externalId = 'default',
    enabled = true,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    // Converts offer info to array of arrays (used in blockchain)
    teeOfferInfo.hardwareInfo = await TeeOffers.packHardwareInfo(teeOfferInfo.hardwareInfo);
    const formattedExternalId = formatBytes32String(externalId);
    await TxManager.execute(
      contract.methods.createTeeOffer(
        providerAuthorityAccount,
        teeOfferInfo,
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
    const founded = await StaticModel.findItemsById('TeeOfferCreated', filter, fromBlock, toBlock);

    if (!founded) return null;

    return founded as OfferCreatedEvent;
  }

  /**
   * Function for fetching TEE offer id by TEE deviceId
   * @param deviceId - unque TEE device id (unparsed, from blockchain)
   * @returns TEE offer id
   */
  public static getByDeviceId(deviceId: string): Promise<string> {
    const contract = BlockchainConnector.getInstance().getContract();

    const fromattedDeviceId = packDeviceId(deviceId);

    return contract.methods.getTeeOfferByDeviceId(fromattedDeviceId).call();
  }

  /**
   * Function for fetching total count of tee offer slots
   */
  public static async getSlotsCount(): Promise<number> {
    const contract = BlockchainConnector.getInstance().getContract();

    return Number(await contract.methods.getTeeOffersSlotsCount().call());
  }

  /**
   * Function for fetching whether tee offer option exists or not
   * @param optionId - Option ID
   */
  public static isOptionExists(optionId: bigint): Promise<boolean> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods.isOptionExists(optionId).call();
  }

  /**
   * Function for fetching total count of options
   */
  public static getOptionsCount(): Promise<bigint> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods.getOptionsCount().call();
  }

  /**
   * Function for fetching tee offer option by id
   * @param optionId - Option ID
   */
  public static async getOptionById(optionId: bigint): Promise<TeeOfferOption> {
    const contract = BlockchainConnector.getInstance().getContract();

    return await contract.methods
      .getOptionById(optionId)
      .call()
      .then((option) => formatTeeOfferOption(option as TeeOfferOption));
  }

  public static async getSlotByExternalId(
    filter: { externalId: string; creator?: string; offerId?: bigint },
    fromBlock?: number | string,
    toBlock?: number | string,
  ): Promise<TeeSlotAddedEvent | null> {
    const founded = await StaticModel.findItemsById('TeeSlotAdded', filter, fromBlock, toBlock);

    if (!founded) return null;

    return founded as TeeSlotAddedEvent;
  }

  public static async getOptionByExternalId(
    filter: {
      externalId: string;
      creator?: string;
      teeOfferId?: bigint;
    },
    fromBlock?: number | string,
    toBlock?: number | string,
  ): Promise<OptionAddedEvent | null> {
    const founded = await StaticModel.findItemsById('OptionAdded', filter, fromBlock, toBlock);

    if (!founded) return null;

    return founded as OptionAddedEvent;
  }

  /**
   * Function for adding event listeners on onSlotAdded event in contract
   * @param creator - creator address
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onSlotAdded(callback: onTeeSlotAddedCallback, creator?: string): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onTeeSlotAdded' });

    const subscription = contract.events.TeeSlotAdded();
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
  public static onSlotUpdated(callback: onTeeSlotUpdatedCallback): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onTeeSlotUpdated' });

    const subscription = contract.events.TeeSlotUpdated();
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
   * Function for adding event listeners on onSlotDeleted event in contract
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onSlotDeleted(callback: onTeeSlotDeletedCallback): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onTeeSlotDeleted' });

    const subscription = contract.events.TeeSlotDeleted();
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
   * Function for adding event listeners on OptionAdded event in contract
   * @param creator - creator address
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onOptionAdded(callback: onTeeOptionAddedCallback, creator?: string): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onTeeOptionAddedCallback' });

    const subscription = contract.events.OptionAdded();
    subscription.on('data', (event: EventLog): void => {
      if (creator && event.returnValues.creator != creator) {
        return;
      }
      callback(
        <string>event.returnValues.creator,
        <bigint>event.returnValues.teeOfferId,
        <bigint>event.returnValues.optionId,
        parseBytes32String(<BytesLike>event.returnValues.externalId),
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
   * Function for adding event listeners on OptionUpdated event in contract
   * @param teeOfferId - tee offer id
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onOptionUpdated(
    callback: onTeeOptionUpdatedCallback,
    teeOfferId?: bigint,
  ): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onTeeOptionUpdatedCallback' });

    const subscription = contract.events.OptionUpdated();
    subscription.on('data', (event: EventLog): void => {
      if (teeOfferId && event.returnValues.teeOfferId != teeOfferId) {
        return;
      }
      callback(
        <bigint>event.returnValues.teeOfferId,
        <bigint>event.returnValues.optionId,
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
   * Function for adding event listeners on OptionDeleted event in contract
   * @param teeOfferId - tee offer id
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onOptionDeleted(
    callback: onTeeOptionDeletedCallback,
    teeOfferId?: bigint,
  ): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onTeeOptionDeletedCallback' });

    const subscription = contract.events.OptionDeleted();
    subscription.on('data', (event: EventLog): void => {
      if (teeOfferId && event.returnValues.teeOfferId != teeOfferId) {
        return;
      }
      callback(
        <bigint>event.returnValues.teeOfferId,
        <bigint>event.returnValues.optionId,
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
   * Function for adding event listeners on TEE offer created event in TEE offers factory contract
   * @param callback - function for processing created TEE offer
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onCreated(callback: onTeeOfferCreatedCallback): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onTeeOfferCreated' });

    const subscription = contract.events.TeeOfferCreated();
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

  public static onViolationRateChanged(callback: onTeeViolationRateChangedCallback): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onTeeOfferViolationRateChanged' });

    const subscription = contract.events.TeeOfferViolationRateChanged();
    subscription.on('data', (event: EventLog): void => {
      callback(
        <bigint>event.returnValues.offerId,
        <string>event.returnValues.providerAuth,
        <bigint>event.returnValues.violationRate,
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

export type onTeeOfferCreatedCallback = (
  offerId: bigint,
  creator: string,
  externalId: string,
  block?: BlockInfo,
) => void;
export type onTeeViolationRateChangedCallback = (
  offerId: bigint,
  providerAuth: string,
  violationRate: bigint,
  block?: BlockInfo,
) => void;
export type onTeeOptionAddedCallback = (
  creator: string,
  teeOfferId: bigint,
  optionId: bigint,
  externalId: string,
  block?: BlockInfo,
) => void;
export type onTeeOptionUpdatedCallback = (
  teeOfferId: bigint,
  optionId: bigint,
  block?: BlockInfo,
) => void;
export type onTeeOptionDeletedCallback = (
  teeOfferId: bigint,
  optionId: bigint,
  block?: BlockInfo,
) => void;
export type onTeeSlotAddedCallback = (
  creator: string,
  offerId: bigint,
  slotId: bigint,
  externalId: string,
  block?: BlockInfo,
) => void;
export type onTeeSlotUpdatedCallback = (offerId: bigint, slotId: bigint, block?: BlockInfo) => void;
export type onTeeSlotDeletedCallback = (offerId: bigint, slotId: bigint, block?: BlockInfo) => void;

export default TeeOffers;
