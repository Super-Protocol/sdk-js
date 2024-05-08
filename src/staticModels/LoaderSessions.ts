import { BlockchainConnector, BlockchainEventsListener } from '../connectors/index.js';
import {
  BlockchainId,
  TransactionOptions,
  LoaderSession,
  NewLoaderSessionArgs,
  SecretRequest,
  BlockInfo,
} from '../types/index.js';
import { cleanWeb3Data } from '../utils/helper.js';
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

  public static get(teeOfferId: BlockchainId): Promise<LoaderSession> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods
      .getLoaderSession(teeOfferId)
      .call()
      .then((session) => cleanWeb3Data(session) as LoaderSession);
  }

  public static async set(
    sessionArgs: NewLoaderSessionArgs,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();

    await TxManager.execute(contract.methods.setLoaderSession(sessionArgs), transactionOptions);
  }

  public static async setSessionAndRequestSecret(
    request: SecretRequest,
    sessionArgs: NewLoaderSessionArgs,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();

    request.offerVersion ?? 0;

    await TxManager.execute(
      contract.methods.setLoaderSessionAndRequestSecret(request, sessionArgs),
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
        <BlockchainId>parsedEvent.loader,
        <BlockchainId>parsedEvent.keeperOfferId,
        <string>parsedEvent.publicSessionsKey,
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
  loader: BlockchainId,
  teeOfferkeeperId: BlockchainId,
  publicSessionsKey: string,
  block?: BlockInfo,
) => void;

export default LoaderSessions;
