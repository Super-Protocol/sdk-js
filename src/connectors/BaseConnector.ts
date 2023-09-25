import rootLogger from "../logger";
import { HttpProvider, WebSocketProvider, ContractAbi, Contract } from "web3";

export type Config = {
    contractAddress: string;
    blockchainUrl?: string;
    gasPrice?: bigint;
    gasLimit?: bigint;
    gasLimitMultiplier?: number;
    gasPriceMultiplier?: number;
    reconnect?: {
        auto?: boolean;
        delay?: number;
        maxAttempts?: number;
        onTimeout?: boolean;
    };
};

export class BaseConnector {
    protected initialized = false;
    protected logger = rootLogger.child({ className: this.constructor["name"] });
    protected contract?: Contract<ContractAbi>;
    protected provider?: WebSocketProvider | HttpProvider;

    public isInitialized(): boolean {
        return this.initialized;
    }

    public checkIfInitialized() {
        if (!this.initialized)
            throw new Error(
                `${this.constructor["name"]} is not initialized, needs to run '${this.constructor["name"]}.initialize(CONFIG)' first`,
            );
    }

    /**
     *
     * @returns initialized contract
     */
    public getContract(): Contract<ContractAbi> {
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
            this.provider?.disconnect(0, "");
            this.initialized = false;
            this.logger.trace(`${this.constructor["name"]} was shutdown`);
        }
    }
}
