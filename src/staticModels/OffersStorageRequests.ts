import { BlockchainConnector, BlockchainEventsListener } from '../connectors/index.js';
import {
  BlockchainId,
  BlockInfo,
  OfferStorageRequest,
  TransactionOptions,
} from '../types/index.js';
import {
  checkIfActionAccountInitialized,
  cleanWeb3Data,
  convertOfferStorageRequestFromRaw,
} from '../utils/helper.js';
import TxManager from '../utils/TxManager.js';
import { EventLog } from 'web3-eth-contract';
import rootLogger from '../logger.js';
import {
  WssSubscriptionOnDataFn,
  WssSubscriptionOnErrorFn,
} from '../connectors/BlockchainEventsListener.js';

class OffersStorageRequests {
  private static readonly logger = rootLogger.child({ className: 'OffersStorageRequests' });

  public static async getCountByIssuerId(): Promise<number> {
    const contract = BlockchainConnector.getInstance().getContract();

    return Number(await contract.methods.getOfferStorageRequestsCountByIssuerId().call());
  }

  public static getByIssuerId(teeOfferIssuerId: BlockchainId): Promise<OfferStorageRequest[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods
      .getOffersStorageRequestsByIssuerId(teeOfferIssuerId)
      .call()
      .then((storageRequestList: unknown[] | void) =>
        storageRequestList!.map((storageRequest) =>
          convertOfferStorageRequestFromRaw(storageRequest as OfferStorageRequest),
        ),
      );
  }

  public static async getByOfferVersion(
    offerId: BlockchainId,
    offerVersion: number = 0,
  ): Promise<OfferStorageRequest | undefined> {
    const contract = BlockchainConnector.getInstance().getContract();
    const storageRequest = await contract.methods
      .getOffersStorageRequestsByOfferVersion(offerId, offerVersion)
      .call()
      .then((sRequest) => convertOfferStorageRequestFromRaw(sRequest as OfferStorageRequest));

    if (Number(storageRequest.timestamp) === 0) {
      return undefined;
    }

    return storageRequest;
  }

  public static async set(
    request: Omit<OfferStorageRequest, 'orderId' | 'timestamp'>,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      contract.methods.setOffersStorageRequest({
        ...request,
        offerVersion: request.offerVersion ?? 0,
        orderId: 0,
        timestamp: 0,
      }),
      transactionOptions,
    );
  }

  public static async cancel(
    offerId: BlockchainId,
    offerVersion: number = 0,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      contract.methods.cancelOfferStorageRequest(offerId, offerVersion),
      transactionOptions,
    );
  }

  public static onOfferStorageRequestCreated(
    callback: onOfferStorageRequestCreatedCallback,
  ): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOfferStorageRequestCreated' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <BlockchainId>parsedEvent.offerId,
        <number>parsedEvent.offerVersion,
        <BlockchainId>parsedEvent.teeOfferIssuerId,
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
      event: 'OfferStorageRequestCreated',
    });
  }

  public static onOfferStorageRequestCanceled(
    callback: onOfferStorageRequestCanceledCallback,
  ): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOfferStorageRequestCanceled' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <BlockchainId>parsedEvent.offerId,
        <number>parsedEvent.offerVersion,
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
      event: 'OfferStorageRequestCanceled',
    });
  }
}

export type onOfferStorageRequestCreatedCallback = (
  offerId: BlockchainId,
  offerVersion: number,
  teeOfferIssuerId: BlockchainId,
  block?: BlockInfo,
) => void;

export type onOfferStorageRequestCanceledCallback = (
  offerId: BlockchainId,
  offerVersion: number,
  block?: BlockInfo,
) => void;

export default OffersStorageRequests;
