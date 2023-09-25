import { BaseConnector, Config } from "./BaseConnector";
import Web3, { WebSocketProvider, AbiParameter } from "web3";
import appJSON from "../contracts/app.json";

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
        return <WebSocketProvider>this.provider;
    }

    /**
     * Function for connecting to blockchain using web socket
     * Needs to run this function before using events
     */
    public async initialize(config: Config): Promise<void> {
        this.logger.trace(config, "Initializing");

        if (this.provider) {
            (this.provider as WebSocketProvider).reset();
        }

        const reconnectOptions = Object.assign(
            {
                auto: true,
                delay: 5000, // ms
                maxAttempts: 5,
                onTimeout: false,
            },
            config.reconnect,
        );

        this.provider = new WebSocketProvider(
            config.blockchainUrl!,
            {
                // TODO
            },
            reconnectOptions,
        );
        store.web3Wss = new Web3(this.provider);

        this.contract = new store.web3Wss!.eth.Contract(<AbiParameter[]>appJSON.abi, config.contractAddress);
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
