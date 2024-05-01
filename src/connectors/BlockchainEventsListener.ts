import _ from 'lodash';
import { BaseConnector, Config } from './BaseConnector.js';
import Web3, { Web3Context, WebSocketProvider } from 'web3';
import { ProviderRpcError, ProviderConnectInfo, EventLog } from 'web3-types';
import { ReconnectOptions } from 'web3-utils';
import { abi } from '../contracts/abi.js';

// TODO: remove this dependencies
import store from '../store.js';
import Superpro from '../staticModels/Superpro.js';
import SuperproToken from '../staticModels/SuperproToken.js';
import * as uuid from 'uuid';
import { LogsSubscription } from 'web3-eth-contract';

export type WssSubscriptionOnDataFn = (event: EventLog) => Promise<void> | void;
export type WssSubscriptionOnErrorFn = (error: Error) => Promise<void> | void;
type UnsubscribeFn = () => Promise<void> | void;
type SubscribeParams = {
  unsubscribe: UnsubscribeFn;
  onData: WssSubscriptionOnDataFn;
  onError: WssSubscriptionOnErrorFn;
  subscription?: LogsSubscription;
  event: string;
};

export default class BlockchainEventsListener extends BaseConnector {
  // Singleton
  private static instance: BlockchainEventsListener;
  private isSubscribingBlocked = false;

  private constructor() {
    super();
  }

  static getInstance(): BlockchainEventsListener {
    if (!BlockchainEventsListener.instance) {
      BlockchainEventsListener.instance = new BlockchainEventsListener();
    }

    return BlockchainEventsListener.instance;
  }

  private readonly subscriptions = new Map<string, SubscribeParams>();

  subscribeEvent(params: Omit<SubscribeParams, 'unsubscribe' | 'subscription'>): UnsubscribeFn {
    if (!this.initialized) {
      throw Error(`${BlockchainEventsListener.name} instance should be initialized before`);
    }
    if (this.isSubscribingBlocked) {
      throw Error(`${BlockchainEventsListener.name} instance should be initialized before`);
    }

    const contract = this.getContract();
    const subscription = contract.events[params.event]();
    const key = uuid.v4();
    this.logger.trace(
      {
        event: params.event,
        key,
      },
      `created subscription`,
    );

    const unsubscribe: UnsubscribeFn = async (): Promise<void> => {
      this.logger.trace(`Unsubscribing ${subscription.id} for event "${params.event}"...`);
      await subscription.unsubscribe();
      this.subscriptions.delete(key);
    };

    new Promise<string>((resolve) => {
      subscription.once('connected', (subscriptionId) => {
        this.logger.trace(
          {
            event: params.event,
            key,
            subscriptionId,
          },
          `subscription is ready: ${subscriptionId}`,
        );
        resolve(subscriptionId);
      });
      subscription.on('data', params.onData);
      subscription.on('error', params.onError);
    })
      .then(() => {
        this.subscriptions.set(key, {
          onData: params.onData,
          onError: params.onError,
          subscription,
          unsubscribe,
          event: params.event,
        });
      })
      .catch((err) => {
        this.logger.error({ err }, 'Subscription readiness error');
      });

    return unsubscribe;
  }

  private async resubscribe(): Promise<boolean> {
    if (!this.subscriptions.size) {
      return true;
    }
    if (!this.initialized) {
      throw Error(`${BlockchainEventsListener.name} instance should be initialized before`);
    }

    const events: Omit<SubscribeParams, 'unsubscribe' | 'subscription'>[] = [];

    for (const [, item] of this.subscriptions) {
      try {
        await item.subscription?.unsubscribe();
      } catch (err) {
        this.logger.error({ err }, 'Failed to unsubscribe');
      }

      events.push(_.omit(item, ['unsubscribe', 'subscription']));
    }

    if (events.length) {
      try {
        await Promise.all(events.map((event) => this.subscribeEvent(event)));
        this.logger.trace(`${events.length} subscriptions were resubscribed`);
      } catch (err) {
        this.logger.error({ err }, 'Something went wrong on resubscribing');

        return false;
      }
    }

    return true;
  }

  async unsubscribeAll(): Promise<boolean> {
    if (this.isSubscribingBlocked) {
      return false;
    }

    this.isSubscribingBlocked = true;

    const promises: {
      unsubscribe: ReturnType<SubscribeParams['unsubscribe']>;
      event: SubscribeParams['event'];
      id: string;
    }[] = [];

    try {
      for (const [id, item] of this.subscriptions) {
        promises.push({
          unsubscribe: item.unsubscribe(),
          id,
          event: item.event,
        });
      }

      const result = await Promise.allSettled(promises);
      result.forEach((item, index) => {
        const data = promises[index];
        if (item.status === 'rejected') {
          this.logger.warn(`Error on ${data.id} unsubscribe "${data.event}" event`);
        } else {
          this.logger.trace(`Unsubscribe ${data.id} for event "${data.event}" has been completed`);
        }
      });

      return true;
    } catch (err) {
      this.logger.error({ err }, 'Something went wrong on unsubscribing');

      return false;
    } finally {
      this.subscriptions.clear();
      this.isSubscribingBlocked = false;
    }
  }

  /**
   * Function for connecting to blockchain using web socket
   * Needs to run this function before using events
   */
  async initialize(config: Config): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.logger.trace(config, 'Initializing');

    const reconnectOptions: ReconnectOptions = Object.assign(
      {
        autoReconnect: true,
        delay: 20000,
        maxAttempts: 5000,
      },
      config.reconnect,
    );

    this.logger.info(
      `Initializing events listener with reconnect options: ${JSON.stringify(reconnectOptions)}`,
    );

    const provider = new WebSocketProvider(
      config.blockchainUrl!,
      {} /* ClientOptions */,
      reconnectOptions,
    );

    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Timeout waiting for Events listener's readiness"));
      }, reconnectOptions.delay ?? 5000);

      provider.once('connect', () => {
        clearTimeout(timeoutId);
        this.logger.info('Events listener ready');
        resolve();
      });
      provider.on('connect', async (info: ProviderConnectInfo) => {
        this.logger.info(info, 'Events listener connected');
        const result = await this.resubscribe();
        if (!result) {
          this.logger.error(
            "Subscriptions have not been activated well on the Events listener's reconnection",
          );
        }
      });

      provider.on('error', (err: unknown) => {
        this.logger.error({
          err: err instanceof Error ? err : (err as ErrorEvent)?.message,
          msg: 'Events listener error',
        });
      });
      provider.on('disconnect', (err: ProviderRpcError | CloseEvent) => {
        if (err?.code === 1000) {
          this.logger.debug('The connection successfully completed');
        } else {
          this.logger.error({
            err:
              err instanceof Error
                ? err
                : {
                    reason: err?.reason,
                    code: err?.code,
                    wasClean: err?.wasClean,
                  },
            msg: 'Events listener disconnect',
          });
        }
      });
    });

    store.web3Wss = new Web3(provider);
    const web3Context = new Web3Context({
      provider: store.web3Wss.currentProvider,
      config: { contractDataInputFill: 'data' },
    });

    this.contract = new store.web3Wss.eth.Contract(abi, config.contractAddress, web3Context);
    Superpro.address = config.contractAddress;
    SuperproToken.addressWss = await Superpro.getTokenAddress(this.contract);

    this.initialized = true;

    this.logger.trace('Initialized');
  }

  async shutdown(): Promise<void> {
    const provider = store.web3Wss?.provider as WebSocketProvider;
    if (provider) {
      const result = await this.unsubscribeAll();
      if (!result) {
        this.logger.warn('UnsubscribeAll could not be done well');
      }

      await provider.safeDisconnect();
    }
    store.web3Wss = undefined;
    super.shutdown();
  }
}
