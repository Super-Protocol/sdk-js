import rootLogger from '../logger.js';
import {
  checkIfActionAccountInitialized,
  cleanWeb3Data,
  convertBigIntToString,
  convertTeeOfferOptionFromRaw,
  packDeviceId,
  unpackSlotInfo,
  convertOptionInfoToRaw,
} from '../utils/helper.js';
import { BytesLike, formatBytes32String, parseBytes32String } from 'ethers/lib/utils.js';
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
  BlockchainId,
  TeeOfferOptionRaw,
} from '../types/index.js';
import { BlockchainConnector, BlockchainEventsListener } from '../connectors/index.js';
import Superpro from './Superpro.js';
import TxManager from '../utils/TxManager.js';
import { EventLog } from 'web3-eth-contract';
import StaticModel from './StaticModel.js';
import {
  WssSubscriptionOnDataFn,
  WssSubscriptionOnErrorFn,
} from '../connectors/BlockchainEventsListener.js';
import TCB from '../models/TCB.js';
import { INACTIVE_TCB_PERIOD, TEE_OFFER_SELECT_FRESH_SIZE } from '../constants.js';
import { createMemoryCache } from '../utils/cache/index.js';
import Consensus from './Consensus.js';
import TeeOffer from '../models/TeeOffer.js';

const inactivePeriod = (timeInMs: number): number => Date.now() - new Date(timeInMs).valueOf();
const inactivePredicate = (timeInMs: number): boolean =>
  inactivePeriod(timeInMs) > INACTIVE_TCB_PERIOD;

class TeeOffers {
  private static cache = createMemoryCache();
  private static coresDenominator?: number;

  private static readonly logger = rootLogger.child({ className: 'TeeOffers' });

  static teeOffers: BlockchainId[] = [];

  static get address(): string {
    return Superpro.address;
  }

  static async packHardwareInfo(hw: HardwareInfo): Promise<HardwareInfo> {
    const denominator = await TeeOffers.getDenominator();
    hw.slotInfo.cpuCores *= denominator;
    hw.slotInfo.gpuCores *= denominator;

    return hw;
  }

  static async unpackHardwareInfo(hw: HardwareInfo): Promise<HardwareInfo> {
    const coresDenominator = await TeeOffers.getDenominator();
    hw.slotInfo = unpackSlotInfo(hw.slotInfo, coresDenominator);
    return hw;
  }

  static async getDenominator(): Promise<number> {
    if (!this.coresDenominator) {
      const contract = BlockchainConnector.getInstance().getContract();
      this.coresDenominator = Number(await contract.methods.getCpuDenominator().call());
    }

    return this.coresDenominator;
  }

  /**
   * Function for fetching list of all TEE offers addresses
   */
  static async getAll(): Promise<BlockchainId[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    const count = Number(await contract.methods.getOffersTotalCount().call());

    const teeOffersSet = new Set(this.teeOffers);

    for (let offerId = teeOffersSet.size + 1; offerId <= count; ++offerId) {
      const offerType = (
        await contract.methods.getOfferType(offerId).call()
      ).toString() as OfferType;
      if (offerType === OfferType.TeeOffer) {
        teeOffersSet.add(offerId.toString());
      }
    }
    this.teeOffers = Array.from(teeOffersSet);

    return this.teeOffers;
  }

  /**
   * Creates new TEE offer
   * @param providerAuthorityAccount - address of authority account of provider
   * @param teeOfferInfo - data of new TEE offer
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  static async create(
    providerAuthorityAccount: string,
    teeOfferInfo: TeeOfferInfo,
    // slotInfo: SlotInfo,
    // optionInfo: OptionInfo,
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
        teeOfferInfo.hardwareInfo.slotInfo,
        convertOptionInfoToRaw(teeOfferInfo.hardwareInfo.optionInfo),
        formattedExternalId,
        enabled,
      ),
      transactionOptions,
    );
  }

  static async getByExternalId(
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
   * @param deviceId - unique TEE device id (unparsed, from blockchain)
   * @returns TEE offer id
   */
  static getByDeviceId(deviceId: string): Promise<BlockchainId> {
    const contract = BlockchainConnector.getInstance().getContract();

    const formattedDeviceId = packDeviceId(deviceId);

    return contract.methods.getTeeOfferByDeviceId(formattedDeviceId).call();
  }

  /**
   * Function for fetching total count of tee offer slots
   */
  static async getSlotsCount(): Promise<number> {
    const contract = BlockchainConnector.getInstance().getContract();

    return Number(await contract.methods.getTeeOffersSlotsCountTotal().call());
  }

  /**
   * Function for fetching whether tee offer option exists or not
   * @param optionId - Option ID
   */
  static isOptionExists(optionId: BlockchainId): Promise<boolean> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods.isOptionExists(optionId).call();
  }

  /**
   * Function for fetching total count of options
   */
  static async getOptionsCount(): Promise<number> {
    const contract = BlockchainConnector.getInstance().getContract();

    return Number(await contract.methods.getOptionsCount().call());
  }

  /**
   * Function for fetching tee offer option by id
   * @param optionId - Option ID
   */
  static async getOptionById(optionId: BlockchainId): Promise<TeeOfferOption> {
    const contract = BlockchainConnector.getInstance().getContract();

    return await contract.methods
      .getOptionById(optionId)
      .call()
      .then((option) => convertTeeOfferOptionFromRaw(option as TeeOfferOptionRaw));
  }

  static async getSlotByExternalId(
    filter: { externalId: string; creator?: string; offerId?: BlockchainId },
    fromBlock?: number | string,
    toBlock?: number | string,
  ): Promise<TeeSlotAddedEvent | null> {
    const founded = await StaticModel.findItemsById('TeeSlotAdded', filter, fromBlock, toBlock);

    if (!founded) return null;

    return founded as TeeSlotAddedEvent;
  }

  static async getOptionByExternalId(
    filter: {
      externalId: string;
      creator?: string;
      teeOfferId?: BlockchainId;
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
  static onSlotAdded(callback: onTeeSlotAddedCallback, creator?: string): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onTeeSlotAdded' });
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
      event: 'TeeSlotAdded',
    });
  }

  /**
   * Function for adding event listeners on onSlotUpdated event in contract
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  static onSlotUpdated(callback: onTeeSlotUpdatedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onTeeSlotUpdated' });
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
      event: 'TeeSlotUpdated',
    });
  }

  /**
   * Function for adding event listeners on onSlotDeleted event in contract
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  static onSlotDeleted(callback: onTeeSlotDeletedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onTeeSlotDeleted' });
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
      event: 'TeeSlotDeleted',
    });
  }

  /**
   * Function for adding event listeners on OptionAdded event in contract
   * @param creator - creator address
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  static onOptionAdded(callback: onTeeOptionAddedCallback, creator?: string): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onTeeOptionAddedCallback' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (creator && parsedEvent.creator != creator) {
        return;
      }
      callback(
        <string>parsedEvent.creator,
        <BlockchainId>parsedEvent.teeOfferId,
        <BlockchainId>parsedEvent.optionId,
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
      event: 'OptionAdded',
    });
  }

  /**
   * Function for adding event listeners on OptionUpdated event in contract
   * @param teeOfferId - tee offer id
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  static onOptionUpdated(
    callback: onTeeOptionUpdatedCallback,
    teeOfferId?: BlockchainId,
  ): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onTeeOptionUpdatedCallback' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (teeOfferId && event.returnValues.teeOfferId != convertBigIntToString(teeOfferId)) {
        return;
      }
      callback(
        <BlockchainId>parsedEvent.teeOfferId,
        <BlockchainId>parsedEvent.optionId,
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
      event: 'OptionUpdated',
    });
  }

  /**
   * Function for adding event listeners on OptionDeleted event in contract
   * @param teeOfferId - tee offer id
   * @param callback - function for processing created order
   * @returns unsubscribe - unsubscribe function from event
   */
  static onOptionDeleted(
    callback: onTeeOptionDeletedCallback,
    teeOfferId?: BlockchainId,
  ): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onTeeOptionDeletedCallback' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (teeOfferId && parsedEvent.teeOfferId != convertBigIntToString(teeOfferId)) {
        return;
      }
      callback(
        <BlockchainId>parsedEvent.teeOfferId,
        <BlockchainId>parsedEvent.optionId,
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
      event: 'OptionDeleted',
    });
  }

  /**
   * Function for adding event listeners on TEE offer created event in TEE offers factory contract
   * @param callback - function for processing created TEE offer
   * @returns unsubscribe - unsubscribe function from event
   */
  static onCreated(callback: onTeeOfferCreatedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onTeeOfferCreated' });
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
      event: 'TeeOfferCreated',
    });
  }

  static onViolationRateChanged(callback: onTeeViolationRateChangedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onTeeOfferViolationRateChanged' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <BlockchainId>parsedEvent.offerId,
        <string>parsedEvent.providerAuth,
        <string>parsedEvent.violationRate,
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
      event: 'TeeOfferViolationRateChanged',
    });
  }

  static getMostRecentlyActive(
    size = TEE_OFFER_SELECT_FRESH_SIZE,
    force = false,
  ): Promise<BlockchainId[]> {
    const key = `${this.getMostRecentlyActive.name}:${size}`;
    const ttl = 5 * 60;

    return this.cache.wrap<BlockchainId[]>(
      key,
      async () => {
        const tcbsCount = await Consensus.getTcbsCount();
        const result = new Set<BlockchainId>();

        for (let tcbId = tcbsCount; tcbId > Math.max(0, tcbsCount - size); tcbId--) {
          const tcb = await new TCB(tcbId.toString()).get();
          if (!tcb || !tcb.timeAdded) {
            continue;
          }
          if (inactivePredicate(tcb.timeAdded * 1000)) {
            break; // there is no need to continue search, timeAdded of next tcbs will be older
          }
          const offerId = (await new TCB(tcbId.toString()).getUtilityData()).teeOfferId;
          const isVerified = await new TeeOffer(offerId).isTeeOfferVerifying();

          if (isVerified) {
            result.add(offerId);
          }
        }

        return [...result];
      },
      { ttl, force },
    );
  }
}

export type onTeeOfferCreatedCallback = (
  offerId: BlockchainId,
  creator: string,
  externalId: string,
  block?: BlockInfo,
) => void;
export type onTeeViolationRateChangedCallback = (
  offerId: BlockchainId,
  providerAuth: string,
  violationRate: bigint | string,
  block?: BlockInfo,
) => void;
export type onTeeOptionAddedCallback = (
  creator: string,
  teeOfferId: BlockchainId,
  optionId: BlockchainId,
  externalId: string,
  block?: BlockInfo,
) => void;
export type onTeeOptionUpdatedCallback = (
  teeOfferId: BlockchainId,
  optionId: BlockchainId,
  block?: BlockInfo,
) => void;
export type onTeeOptionDeletedCallback = (
  teeOfferId: BlockchainId,
  optionId: BlockchainId,
  block?: BlockInfo,
) => void;
export type onTeeSlotAddedCallback = (
  creator: string,
  offerId: BlockchainId,
  slotId: BlockchainId,
  externalId: string,
  block?: BlockInfo,
) => void;
export type onTeeSlotUpdatedCallback = (
  offerId: BlockchainId,
  slotId: BlockchainId,
  block?: BlockInfo,
) => void;
export type onTeeSlotDeletedCallback = (
  offerId: BlockchainId,
  slotId: BlockchainId,
  block?: BlockInfo,
) => void;

export default TeeOffers;
