import { BlockchainConnector, BlockchainEventsListener } from '../connectors/index.js';
import {
  BlockchainId,
  TransactionOptions,
  BlockInfo,
  OfferResourceObj,
  OfferResource,
  OrderInfo,
  OrderSlots,
  orderInfoToRaw,
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
      .getOfferResourcesgetByKeeperId(teeOfferKeeperId)
      .call()
      .then((resources: unknown[] | void) =>
        resources!.map((resource) => cleanWeb3Data(resource) as OfferResource),
      );
  }

  public static getByIssuerId(teeOfferIssuerId: BlockchainId): Promise<OfferResource[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods
      .getOfferResourcesgetByIssuerId(teeOfferIssuerId)
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
      .getOfferResourcesgetByOfferVersion(offerId, version)
      .call()
      .then((resources: unknown[] | void) =>
        resources!.map((resource) => cleanWeb3Data(resource) as OfferResource),
      );
  }

  public static async getCountByKeeperId(teeOfferKeeperId: BlockchainId): Promise<number> {
    const contract = BlockchainConnector.getInstance().getContract();

    return Number(await contract.methods.getOfferResourcesCountByKeeperId(teeOfferKeeperId).call());
  }

  public static async set(
    offerResource: OfferResourceObj,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    offerResource.offerVersion ?? 0;

    await TxManager.execute(contract.methods.setLoaderSession(offerResource), transactionOptions);
  }

  public static async createOrder(
    orderInfo: OrderInfo,
    slots: OrderSlots,
    transactionOptions?: TransactionOptions,
    checkTxBeforeSend = false,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    const args = orderInfo.args;
    const orderInfoArguments = orderInfoToRaw(orderInfo);

    // TODO: signature
    const signature = '';

    if (checkTxBeforeSend) {
      await TxManager.dryRun(
        contract.methods.setLoaderSession(orderInfoArguments, slots, args, signature),
        transactionOptions,
      );
    }

    await TxManager.execute(
      contract.methods.setLoaderSession(orderInfoArguments, slots, args, signature),
      transactionOptions,
    );
  }

  public static async clearOfferResources(
    teeOfferKeeperId: BlockchainId,
    maxCount: number = 0,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    if (maxCount == 0) {
      maxCount = await OfferResources.getCountByKeeperId(teeOfferKeeperId);
    }

    if (maxCount == 0) {
      return;
    }

    await TxManager.execute(
      contract.methods.clearOfferResources(teeOfferKeeperId, maxCount),
      transactionOptions,
    );
  }

  public static onNewOfferResources(callback: onNewOfferResourcesCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onNewOfferResources' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <BlockchainId>parsedEvent.offerId,
        <number>parsedEvent.version,
        <BlockchainId>parsedEvent.keeperId,
        <BlockchainId>parsedEvent.issuerId,
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
      event: 'NewOfferResources',
    });
  }
}

export type onNewOfferResourcesCallback = (
  offerId: BlockchainId,
  version: number,
  keeperId: BlockchainId,
  issuerId: BlockchainId,
  block?: BlockInfo,
) => void;

export default OfferResources;
