import { BlockchainConnector, BlockchainEventsListener } from '../connectors/index.js';
import {
  BlockInfo,
  BlockchainId,
  TransactionOptions,
  LoaderSecretPublicKey,
  PublicKey,
  Signature,
} from '../types/index.js';
import { cleanWeb3Data, convertLoaderSecretPublicKeyFromRaw } from '../utils/helper.js';
import TxManager from '../utils/TxManager.js';
import { EventLog } from 'web3-eth-contract';
import rootLogger from '../logger.js';
import {
  WssSubscriptionOnDataFn,
  WssSubscriptionOnErrorFn,
} from '../connectors/BlockchainEventsListener.js';

class LoaderSecretPublicKeys {
  private static readonly logger = rootLogger.child({ className: 'LoaderSecretPublicKeys' });

  public static async get(teeOfferId: BlockchainId): Promise<LoaderSecretPublicKey | undefined> {
    const contract = BlockchainConnector.getInstance().getContract();
    const secretPublicKey = await contract.methods
      .getLoaderSecretPublicKey(teeOfferId)
      .call()
      .then((secretKey) => convertLoaderSecretPublicKeyFromRaw(secretKey as LoaderSecretPublicKey));

    if (Number(secretPublicKey.timestamp) === 0) {
      return undefined;
    }

    return secretPublicKey;
  }

  public static async set(
    teeOfferId: BlockchainId,
    signature: Signature,
    secretPublicKey: PublicKey,
    signedTime: number,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();

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
        <PublicKey>cleanWeb3Data(parsedEvent.secretPublicKey),
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
  secretPublicKey: PublicKey,
  block?: BlockInfo,
) => void;

export default LoaderSecretPublicKeys;
