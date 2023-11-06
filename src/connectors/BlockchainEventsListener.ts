import { BaseConnector, Config } from "./BaseConnector";
import Web3 from "web3";
import appJSON from "../contracts/app.json";
import { AbiItem } from "web3-utils";
import { WebsocketProviderBase } from "web3-core-helpers";

// TODO: remove this dependencies
import store from "../store";
import Superpro from "../staticModels/Superpro";
import SuperproToken from "../staticModels/SuperproToken";

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

    public getProvider() {
        return <WebsocketProviderBase | undefined>this.provider;
    }

    /**
     * Function for connecting to blockchain using web socket
     * Needs to run this function before using events
     */
    public async initialize(config: Config): Promise<void> {
        this.logger.trace(config, "Initializing");

        if (this.provider) {
            (this.provider as WebsocketProviderBase).reset();
        }

        const reconnectOptions = Object.assign(
            {
                auto: true,
                delay: 20000, // ms
                maxAttempts: 5000,
                onTimeout: false,
            },
            config.reconnect,
        );

        this.logger.info(`Initializing events listener with reconnect options: ${JSON.stringify(reconnectOptions)}`);

        this.provider = new Web3.providers.WebsocketProvider(config.blockchainUrl!, {
            reconnect: reconnectOptions,
            timeout: 100000,
            reconnectDelay: 20000
        });

        store.web3Wss = new Web3(this.provider);

        this.contract = new store.web3Wss!.eth.Contract(<AbiItem[]>appJSON.abi, config.contractAddress);
        Superpro.address = config.contractAddress;
        SuperproToken.addressWss = await Superpro.getTokenAddress(this.contract);

        this.initialized = true;

        this.logger.trace("Initialized");
    }

    public shutdown() {
        super.shutdown();
        store.web3Wss = undefined;
    }
}

export default BlockchainEventsListener;
