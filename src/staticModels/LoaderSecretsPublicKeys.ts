import { BlockchainConnector, BlockchainEventsListener } from '../connectors/index.js';
import {
  BlockInfo,
  BlockchainId,
  TransactionOptions,
  LoaderSecretPublicKey,
} from '../types/index.js';
import { cleanWeb3Data } from '../utils/helper.js';
import TxManager from '../utils/TxManager.js';
import { EventLog } from 'web3-eth-contract';
import rootLogger from '../logger.js';
import {
  WssSubscriptionOnDataFn,
  WssSubscriptionOnErrorFn,
} from '../connectors/BlockchainEventsListener.js';

class LoaderSecretPublicKeys {
  private static readonly logger = rootLogger.child({ className: 'LoaderSecretPublicKeys' });

  public static get(teeOfferId: BlockchainId): Promise<LoaderSecretPublicKey> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods
      .getLoaderSecretPublicKey(teeOfferId)
      .call()
      .then((secretKey) => cleanWeb3Data(secretKey) as LoaderSecretPublicKey);
  }

  public static async set(
    teeOfferId: BlockchainId,
    signature: string,
    secretPublicKey: string,
    signedTime: number,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();

    // TODO: transform 'signature'

    await TxManager.execute(
      contract.methods.setLoaderSecretPublicKey(teeOfferId, signature, secretPublicKey, signedTime),
      transactionOptions,
    );
  }

  public static onLoaderSecretPublicKeySessionUpdated(
    callback: onLoaderSecretPublicKeySessionUpdatedCallback,
  ): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onLoaderSecretPublicKeySessionUpdated' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <BlockchainId>parsedEvent.teeOfferId,
        <string>parsedEvent.secretPublicKey,
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
      event: 'LoaderSecretPublicKeySessionUpdated',
    });
  }
}

export type onLoaderSecretPublicKeySessionUpdatedCallback = (
  teeOfferId: BlockchainId,
  secretPublicKey: string,
  block?: BlockInfo,
) => void;

export default LoaderSecretPublicKeys;
