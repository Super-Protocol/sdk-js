import { BlockchainConnector, BlockchainEventsListener } from '../connectors/index.js';
import { BlockchainId, BlockInfo, SecretRequest, TransactionOptions } from '../types/index.js';
import {
  checkIfActionAccountInitialized,
  cleanWeb3Data,
  convertSecretRequestFromRaw,
} from '../utils/helper.js';
import TxManager from '../utils/TxManager.js';
import { EventLog } from 'web3-eth-contract';
import rootLogger from '../logger.js';
import {
  WssSubscriptionOnDataFn,
  WssSubscriptionOnErrorFn,
} from '../connectors/BlockchainEventsListener.js';
import { AMOY_TX_GAS_LIMIT } from '../constants.js';

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
        requests!.map((request) => convertSecretRequestFromRaw(request as SecretRequest)),
      );
  }

  public static getByRequestorId(teeOfferRequestorId: BlockchainId): Promise<SecretRequest[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods
      .getSecretRequestsByRequestorId(teeOfferRequestorId)
      .call()
      .then((requests: unknown[] | void) =>
        requests!.map((request) => convertSecretRequestFromRaw(request as SecretRequest)),
      );
  }

  public static async set(
    request: SecretRequest,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    request.offerVersion = request.offerVersion ?? 0;
    request.timestamp = 0;

    await TxManager.execute(contract.methods.setSecretRequest(request), transactionOptions);
  }

  public static async clear(
    teeOfferKeeperId: BlockchainId,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);
    transactionOptions!.gas = AMOY_TX_GAS_LIMIT;

    await TxManager.execute(
      contract.methods.clearSecretRequests(teeOfferKeeperId),
      transactionOptions,
    );
  }

  public static async cancel(
    request: Omit<SecretRequest, 'timestamp'>,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      contract.methods.cancelSecretRequest({
        ...request,
        offerVersion: request.offerVersion ?? 0,
        timestamp: 0,
      }),
      transactionOptions,
    );
  }

  public static onSecretRequestCreated(callback: onSecretRequestCreatedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onSecretRequestCreated' });
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
      event: 'SecretRequestCreated',
    });
  }
}

export type onSecretRequestCreatedCallback = (
  secretRequestorId: BlockchainId,
  secretKeeperId: BlockchainId,
  offerId: BlockchainId,
  offerVersion: number,
  block?: BlockInfo,
) => void;

export default SecretRequests;
