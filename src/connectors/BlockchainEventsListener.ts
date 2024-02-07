import { BaseConnector, Config } from './BaseConnector';
import Web3, { Web3Context, WebSocketProvider } from 'web3';
import { ProviderRpcError, ProviderConnectInfo } from 'web3-types';
import { ReconnectOptions } from 'web3-utils';
import { abi } from '../contracts/abi';

// TODO: remove this dependencies
import store from '../store';
import Superpro from '../staticModels/Superpro';
import SuperproToken from '../staticModels/SuperproToken';

class BlockchainEventsListener extends BaseConnector {
  // Singleton
  private static instance: BlockchainEventsListener;

  private constructor() {
    super();
  }

  public static getInstance(): BlockchainEventsListener {
    if (!BlockchainEventsListener.instance) {
      BlockchainEventsListener.instance = new BlockchainEventsListener();
    }

    return BlockchainEventsListener.instance;
  }

  public getProvider(): WebSocketProvider | undefined {
    return <WebSocketProvider>store.web3Wss?.provider;
  }

  /**
   * Function for connecting to blockchain using web socket
   * Needs to run this function before using events
   */
  public async initialize(config: Config): Promise<void> {
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

    provider.on('connect', (info: ProviderConnectInfo) => {
      this.logger.info(info, 'Events listener connect');
    });
    provider.on('disconnect', (err: ProviderRpcError) => {
      this.logger.error(err, 'Events listener disconnect');
    });
    provider.on('error', (err: unknown) => {
      this.logger.error(err, 'Events listener error');
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

  public shutdown(): void {
    super.shutdown();
    store.web3Wss?.provider?.disconnect();
    store.web3Wss = undefined;
  }
}

export default BlockchainEventsListener;
