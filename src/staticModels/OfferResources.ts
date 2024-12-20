import { BlockchainConnector, BlockchainEventsListener } from '../connectors/index.js';
import {
  BlockchainId,
  TransactionOptions,
  BlockInfo,
  OfferResource,
  Signature,
} from '../types/index.js';
import {
  checkIfActionAccountInitialized,
  cleanWeb3Data,
  convertOfferResourceFromRaw,
} from '../utils/helper.js';
import TxManager from '../utils/TxManager.js';
import { EventLog } from 'web3-eth-contract';
import rootLogger from '../logger.js';
import {
  WssSubscriptionOnDataFn,
  WssSubscriptionOnErrorFn,
} from '../connectors/BlockchainEventsListener.js';
import { AMOY_TX_GAS_LIMIT } from '../constants.js';

class OfferResources {
  private static readonly logger = rootLogger.child({ className: 'OfferResources' });

  public static getByKeeperId(teeOfferKeeperId: BlockchainId): Promise<OfferResource[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods
      .getOfferResourcesByKeeperId(teeOfferKeeperId)
      .call()
      .then((resources: unknown[] | void) =>
        resources!.map((resource) => convertOfferResourceFromRaw(resource as OfferResource)),
      );
  }

  public static getByIssuerId(teeOfferIssuerId: BlockchainId): Promise<OfferResource[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods
      .getOfferResourcesByIssuerId(teeOfferIssuerId)
      .call()
      .then((resources: unknown[] | void) =>
        resources!.map((resource) => convertOfferResourceFromRaw(resource as OfferResource)),
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
        resources!.map((resource) => convertOfferResourceFromRaw(resource as OfferResource)),
      );
  }

  public static async get(
    teeOfferIssuerId: BlockchainId,
    teeOfferKeeperId: BlockchainId,
    offerId: BlockchainId,
    version: number = 0,
  ): Promise<OfferResource | undefined> {
    const contract = BlockchainConnector.getInstance().getContract();
    const resource = await contract.methods
      .getOfferResource(teeOfferIssuerId, teeOfferKeeperId, offerId, version)
      .call()
      .then((resource) => convertOfferResourceFromRaw(resource as OfferResource));

    if (Number(resource.timestamp) === 0) {
      return undefined;
    }

    return resource;
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
        solutionHash: offerResource.solutionHash ?? '',
        timestamp: 0,
      }),
      transactionOptions,
    );
  }

  public static async increaseReplicationFactor(
    offerResource: Omit<OfferResource, 'timestamp'>,
    n: number,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      contract.methods.increaseReplicationFactor(
        {
          ...offerResource,
          offerVersion: offerResource.offerVersion ?? 0,
          solutionHash: offerResource.solutionHash ?? '',
          timestamp: 0,
        },
        n,
      ),
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

  public static async clear(
    teeOfferKeeperId: BlockchainId,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    const options: TransactionOptions = {
      gas: AMOY_TX_GAS_LIMIT,
      ...transactionOptions,
    };

    await TxManager.execute(contract.methods.clearOfferResources(teeOfferKeeperId), options);
  }

  public static async remove(
    teeOfferIssuerId: BlockchainId,
    teeOfferKeeperId: BlockchainId,
    offerId: BlockchainId,
    offerVersion: number = 0,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    const options: TransactionOptions = {
      gas: AMOY_TX_GAS_LIMIT,
      ...transactionOptions,
    };

    await TxManager.execute(
      contract.methods.removeOfferResource(
        teeOfferIssuerId,
        teeOfferKeeperId,
        offerId,
        offerVersion,
      ),
      options,
    );
  }

  public static onOfferResourceCreated(callback: onOfferResourceCreatedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOfferResourceCreated' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <BlockchainId>parsedEvent.offerId,
        <number>parsedEvent.offerVersion,
        <BlockchainId>parsedEvent.teeOfferKeeperId,
        <BlockchainId>parsedEvent.teeOfferIssuerId,
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
