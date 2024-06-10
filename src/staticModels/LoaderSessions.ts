import { BlockchainConnector, BlockchainEventsListener } from '../connectors/index.js';
import {
  BlockchainId,
  TransactionOptions,
  LoaderSession,
  SecretRequest,
  PublicKey,
  BlockInfo,
} from '../types/index.js';
import { cleanWeb3Data, convertLoaderSessionFromRaw } from '../utils/helper.js';
import TxManager from '../utils/TxManager.js';
import { EventLog } from 'web3-eth-contract';
import rootLogger from '../logger.js';
import {
  WssSubscriptionOnDataFn,
  WssSubscriptionOnErrorFn,
} from '../connectors/BlockchainEventsListener.js';

class LoaderSessions {
  private static readonly logger = rootLogger.child({ className: 'LoaderSessions' });

  public static getEnabledLoaders(): Promise<BlockchainId[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods.getEnabledLoaders().call();
  }

  public static getDisabledLoaders(): Promise<BlockchainId[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods.getDisabledLoaders().call();
  }

  public static async get(teeOfferId: BlockchainId): Promise<LoaderSession | undefined> {
    const contract = BlockchainConnector.getInstance().getContract();
    const loaderSession = await contract.methods
      .getLoaderSession(teeOfferId)
      .call()
      .then((session) => convertLoaderSessionFromRaw(session as LoaderSession));

    if (Number(loaderSession.timestamp) === 0) {
      return undefined;
    }

    return loaderSession;
  }

  public static async set(
    teeOfferIssuerId: BlockchainId,
    sessionPublicKey: PublicKey,
    signature: string,
    signedTime: number,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();

    await TxManager.execute(
      contract.methods.setLoaderSession(sessionPublicKey, signature, teeOfferIssuerId, signedTime),
      transactionOptions,
    );
  }

  public static async setSessionAndRequestSecret(
    request: Omit<SecretRequest, 'timestamp'>,
    teeOfferIssuerId: BlockchainId,
    sessionPublicKey: PublicKey,
    signature: string,
    signedTime: number,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();

    await TxManager.execute(
      contract.methods.setLoaderSessionAndRequestSecret(
        {
          ...request,
          offerVersion: request.offerVersion ?? 0,
          timestamp: 0,
        },
        sessionPublicKey,
        signature,
        teeOfferIssuerId,
        signedTime,
      ),
      transactionOptions,
    );
  }

  public static async disableLoader(
    teeOfferId: BlockchainId,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();

    await TxManager.execute(contract.methods.disableLoader(teeOfferId), transactionOptions);
  }

  public static onLoaderSessionKeyUpdated(callback: onLoaderSessionKeyUpdatedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onLoaderSessionKeyUpdated' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <BlockchainId>parsedEvent.teeOfferIssuerId,
        <PublicKey>cleanWeb3Data(parsedEvent.publicSessionsKey),
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
      event: 'LoaderSessionKeyUpdated',
    });
  }
}

export type onLoaderSessionKeyUpdatedCallback = (
  teeOfferIssuerId: BlockchainId,
  publicSessionsKey: PublicKey,
  block?: BlockInfo,
) => void;

export default LoaderSessions;
