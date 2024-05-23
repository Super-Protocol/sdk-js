import { BlockchainConnector, BlockchainEventsListener } from '../connectors/index.js';
import {
  BlockchainId,
  TransactionOptions,
  BlockInfo,
  OfferResource,
  Signature,
} from '../types/index.js';
import { checkIfActionAccountInitialized, cleanWeb3Data } from '../utils/helper.js';
import TxManager from '../utils/TxManager.js';
import { EventLog } from 'web3-eth-contract';
import rootLogger from '../logger.js';
import {
  WssSubscriptionOnDataFn,
  WssSubscriptionOnErrorFn,
} from '../connectors/BlockchainEventsListener.js';

class OfferResources {
  private static readonly logger = rootLogger.child({ className: 'OfferResources' });

  public static getByKeeperId(teeOfferKeeperId: BlockchainId): Promise<OfferResource[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods
      .getOfferResourcesByKeeperId(teeOfferKeeperId)
      .call()
      .then((resources: unknown[] | void) =>
        resources!.map((resource) => cleanWeb3Data(resource) as OfferResource),
      );
  }

  public static getByIssuerId(teeOfferIssuerId: BlockchainId): Promise<OfferResource[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods
      .getOfferResourcesByIssuerId(teeOfferIssuerId)
      .call()
      .then((resources: unknown[] | void) =>
        resources!.map((resource) => cleanWeb3Data(resource) as OfferResource),
      );
  }

  public static getByOfferVersion(
    offerId: BlockchainId,
    version: number = 0,
  ): Promise<OfferResource[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods
      .getOfferResourcesByOfferVersion(offerId, version)
      .call()
      .then((resources: unknown[] | void) =>
        resources!.map((resource) => cleanWeb3Data(resource) as OfferResource),
      );
  }

  public static get(
    teeOfferIssuerId: BlockchainId,
    teeOfferKeeperId: BlockchainId,
    offerId: BlockchainId,
    version: number = 0,
  ): Promise<OfferResource> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods
      .getOfferResource(teeOfferIssuerId, teeOfferKeeperId, offerId, version)
      .call()
      .then((resource) => cleanWeb3Data(resource) as OfferResource);
  }

  public static async getCountByKeeperId(teeOfferKeeperId: BlockchainId): Promise<number> {
    const contract = BlockchainConnector.getInstance().getContract();

    return Number(await contract.methods.getOfferResourcesCountByKeeperId(teeOfferKeeperId).call());
  }

  public static async set(
    offerResource: Omit<OfferResource, 'timestamp'>,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      contract.methods.setOfferResource({
        ...offerResource,
        offerVersion: offerResource.offerVersion ?? 0,
        timestamp: 0,
      }),
      transactionOptions,
    );
  }

  public static async createOrder(
    requestOfferId: BlockchainId,
    requestOfferVersion: number = 0,
    resultInfo: string,
    resultInfoSignatureBySecretKey: Signature,
    signedTime: number,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      contract.methods.createResourceOrder(
        requestOfferId,
        requestOfferVersion,
        resultInfo,
        resultInfoSignatureBySecretKey,
        signedTime,
      ),
      transactionOptions,
    );
  }

  public static async clearOfferResources(
    teeOfferKeeperId: BlockchainId,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      contract.methods.clearOfferResources(teeOfferKeeperId),
      transactionOptions,
    );
  }

  public static onOfferResourceCreated(callback: onOfferResourceCreatedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOfferResourceCreated' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <BlockchainId>parsedEvent.offerId,
        <number>parsedEvent.version,
        <BlockchainId>parsedEvent.keeperId,
        <BlockchainId>parsedEvent.issuerId,
        <string>parsedEvent.transactionHash,
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
      event: 'OfferResourceCreated',
    });
  }

  public static onOrderResourceCreated(callback: onOrderResourceCreatedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOrderResourceCreated' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <BlockchainId>parsedEvent.requestOfferId,
        <number>parsedEvent.requestOfferVersion,
        <BlockchainId>parsedEvent.orderId,
        <string>parsedEvent.transactionHash,
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
      event: 'OrderResourceCreated',
    });
  }
}

export type onOfferResourceCreatedCallback = (
  offerId: BlockchainId,
  offerVersion: number,
  teeOfferKeeperId: BlockchainId,
  teeOfferIssuerId: BlockchainId,
  transactionHash: string,
  block?: BlockInfo,
) => void;

export type onOrderResourceCreatedCallback = (
  requestOfferId: BlockchainId,
  requestOfferVersion: number,
  orderId: BlockchainId,
  transactionHash: string,
  block?: BlockInfo,
) => void;

export default OfferResources;
