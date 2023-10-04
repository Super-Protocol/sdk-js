import abi from '../contracts/abi';
import rootLogger from '../logger';
import { ContractAbi, Contract } from 'web3';
import store from '../store';

export type Config = {
    contractAddress: string;
    blockchainUrl?: string;
    gasPrice?: bigint;
    gasLimit?: bigint;
    gasLimitMultiplier?: number;
    gasPriceMultiplier?: number;
    txConcurrency?: number;
    txIntervalMs?: number;
    reconnect?: {
        auto?: boolean;
        delay?: number;
        maxAttempts?: number;
        onTimeout?: boolean;
    };
};

export class BaseConnector {
    protected initialized = false;
    protected logger = rootLogger.child({ className: this.constructor['name'] });
    protected contract?: Contract<ContractAbi>;

    public isInitialized(): boolean {
        return this.initialized;
    }

    public checkIfInitialized(): void {
        if (!this.initialized)
            throw new Error(
                `${this.constructor['name']} is not initialized, needs to run '${this.constructor['name']}.initialize(CONFIG)' first`,
            );
    }

    /**
     *
     * @returns initialized contract
     */
    public getContract(): Contract<typeof abi> {
        this.checkIfInitialized();

        return this.contract!;
    }

    /**
     * Function for connecting to blockchain
     * Used to setting up settings for blockchain connector
     * Needs to run this function before using blockchain connector
     */
    public async initialize(_config: Config): Promise<void> {}

    public shutdown(): void {
        if (this.initialized) {
            this.initialized = false;
            this.logger.trace(`${this.constructor['name']} was shutdown`);
        }
    }
}
