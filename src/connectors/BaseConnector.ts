import rootLogger from "../logger";
import { HttpProviderBase, WebsocketProviderBase } from "web3-core-helpers";
import { Contract } from "web3-eth-contract";

export type Config = {
    contractAddress: string;
    blockchainUrl?: string;
    gasPrice?: string;
    gasLimit?: number;
    gasLimitMultiplier?: number;
    reconnect?: {
        auto?: boolean;
        delay?: number;
        maxAttempts?: number;
        onTimeout?: boolean;
    };
};

export class BaseConnector {
    protected initialized: boolean = false;
    protected logger = rootLogger.child({ className: this.constructor["name"] });
    protected contract?: Contract;
    protected provider?: WebsocketProviderBase | HttpProviderBase;

    public isInitialized(): boolean {
        return this.initialized;
    }

    public checkIfInitialized () {
        if (!this.initialized)
            throw new Error(
                `${this.constructor["name"]} is not initialized, needs to run '${this.constructor["name"]}.initialize(CONFIG)' first`,
            );
    }

    /**
     * 
     * @returns initialized contract
     */
    public getContract(): Contract {
        this.checkIfInitialized();

        return this.contract!;
    }

    /**
     * Function for connecting to blockchain
     * Used to setting up settings for blockchain connector
     * Needs to run this function before using blockchain connector
     */
    public async initialize(config: Config): Promise<void> {}

    public shutdown() {
        if (this.initialized) {
            this.provider?.disconnect(0, "") ;
            this.initialized = false;
            this.logger.trace(`${this.constructor["name"]} was shutdown`);
        }
    }
}
