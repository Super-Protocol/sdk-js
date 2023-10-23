import { BaseConnector, Config } from './BaseConnector';
import Web3, { Web3Context, WebSocketProvider } from 'web3';
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

    const reconnectOptions = Object.assign(
      {
        auto: true,
        delay: 5000, // ms
        maxAttempts: 5,
        onTimeout: false,
      },
      config.reconnect,
    );

    const provider = new WebSocketProvider(config.blockchainUrl!, {}, reconnectOptions);
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
    store.web3Wss?.provider?.disconnect(0, '');
    store.web3Wss = undefined;
  }
}

export default BlockchainEventsListener;
