import { BlockchainConnector, BlockchainEventsListener } from '../connectors/index.js';
import {
  BlockchainId,
  BlockInfo,
  SecretRequest,
  SecretRequestObj,
  TransactionOptions,
} from '../types/index.js';
import { checkIfActionAccountInitialized, cleanWeb3Data } from '../utils/helper.js';
import TxManager from '../utils/TxManager.js';
import { EventLog } from 'web3-eth-contract';
import rootLogger from '../logger.js';
import {
  WssSubscriptionOnDataFn,
  WssSubscriptionOnErrorFn,
} from '../connectors/BlockchainEventsListener.js';

class SecretRequests {
  private static readonly logger = rootLogger.child({ className: 'SecretRequests' });

  public static async getCountByKeeperId(teeOfferKeeperId: BlockchainId): Promise<number> {
    const contract = BlockchainConnector.getInstance().getContract();

    return Number(await contract.methods.getSecretRequestsCountByKeeperId(teeOfferKeeperId).call());
  }

  public static getByKeeperId(teeOfferIssuerId: BlockchainId): Promise<SecretRequest[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods
      .getSecretRequestsByKeeperId(teeOfferIssuerId)
      .call()
      .then((requests: unknown[] | void) =>
        requests!.map((request) => cleanWeb3Data(request) as SecretRequest),
      );
  }

  public static async add(
    request: SecretRequestObj,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    request.offerVersion ?? 0;

    await TxManager.execute(contract.methods.addSecretRequest(request), transactionOptions);
  }

  public static async clear(
    teeOfferKeeperId: BlockchainId,
    maxCount: number,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      contract.methods.clearSecretRequests(teeOfferKeeperId, maxCount),
      transactionOptions,
    );
  }

  public static async cancel(
    request: SecretRequestObj,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(contract.methods.cancelSecretRequest(request), transactionOptions);
  }

  public static onSecretRequestAdded(callback: onSecretRequestAddedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onSecretRequestAdded' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <BlockchainId>parsedEvent.secretRequestorId,
        <BlockchainId>parsedEvent.secretKeeperId,
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
      event: 'SecretRequestAdded',
    });
  }
}

export type onSecretRequestAddedCallback = (
  secretRequestorId: BlockchainId,
  secretKeeperId: BlockchainId,
  offerId: BlockchainId,
  offerVersion: number,
  block?: BlockInfo,
) => void;

export default SecretRequests;
