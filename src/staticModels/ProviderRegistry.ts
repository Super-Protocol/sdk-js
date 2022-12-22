import rootLogger from "../logger";
import { checkIfActionAccountInitialized, objectToTuple } from "../utils";
import { ProviderInfo, ProviderInfoStructure } from "../types/Provider";
import { BigNumber } from "ethers";
import { BlockInfo, ContractEvent, TransactionOptions } from "../types/Web3";
import BlockchainConnector from "../connectors/BlockchainConnector";
import TxManager from "../utils/TxManager";
import BlockchainEventsListener from "../connectors/BlockchainEventsListener";

class ProviderRegistry {
    private static readonly logger = rootLogger.child({ className: "ProviderRegistry" });

    public static providers?: string[];

    /**
     * Function for fetching list of all providers addresses
     */
    public static async getAllProviders(): Promise<string[]> {
        const contract = BlockchainConnector.getInstance().getContract();
        this.providers = await contract.methods.getProvidersAuths().call();

        return this.providers!;
    }

    /**
     * Fetch provider address by provider authority account
     */
    public static async get(providerAuthority: string): Promise<string> {
        return providerAuthority;
    }

    /**
     * Fetch provider security deposit by provider authority account
     */
    public static async getSecurityDeposit(providerAuthority: string): Promise<string> {
        const contract = BlockchainConnector.getInstance().getContract();

        return await contract.methods.getProviderSecurityDeposit(providerAuthority).call();
    }

    public static async isProviderRegistered(providerAuthority: string): Promise<boolean> {
        const contract = BlockchainConnector.getInstance().getContract();

        return await contract.methods.isProviderRegistered(providerAuthority).call();
    }

    /**
     * Reg new provider
     * @param providerInfo - data of new provider
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async registerProvider(
        providerInfo: ProviderInfo,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        const providerInfoParams = objectToTuple(providerInfo, ProviderInfoStructure);
        await TxManager.execute(contract.methods.registerProvider, [providerInfoParams], transactionOptions);
    }

    /**
     * Refills security deposit for provider
     * Call this function with provider authority account (in transactionOptions)
     * @param amount - amount of additional tokens
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async refillSecurityDeposit(amount: string, transactionOptions?: TransactionOptions): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(contract.methods.refillProviderSecurityDepo, [amount], transactionOptions);
    }

    /**
     * Return security deposit for provider
     * Call this function with provider authority account (in transactionOptions)
     * @param amount - amount of tokens to return
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async returnSecurityDeposit(amount: string, transactionOptions?: TransactionOptions): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(contract.methods.returnProviderSecurityDepo, [amount], transactionOptions);
    }

    /**
     * Function for adding event listeners on provider registered event in provider registry
     * @param callback - function for processing new provider
     * @return unsubscribe - unsubscribe function from event
     */
    public static onProviderRegistered(callback: onProviderRegisteredCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onProviderRegistered" });

        const subscription = contract.events
            .ProviderRegistered()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.auth,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for adding event listeners on provider modified event in provider registry
     * @param callback - function for processing modified provider
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onProviderModified(callback: onProviderModifiedCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onProviderModified" });

        const subscription = contract.events
            .ProviderModified()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.auth,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for adding event listeners on provider violation rate incremented event in provider registry
     * @param callback - function for processing new violation rate
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onProviderViolationRateIncremented(callback: onProviderViolationRateIncrementedCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onProviderViolationRateIncremented" });

        const subscription = contract.events
            .ProviderViolationRateIncremented()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.auth,
                    <BigNumber>event.returnValues.newViolationRate,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for adding event listeners on provider security deposit refilled event in provider registry
     * @param callback - function for processing refilled security deposit
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onProviderSecurityDepoRefilled(callback: onProviderSecurityDepoRefilledCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onProviderSecurityDepoRefilled" });

        const subscription = contract.events
            .ProviderSecurityDepoRefilled()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.auth,
                    <string>event.returnValues.amount,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for adding event listeners on provider security deposit unlocked event in provider registry
     * @param callback - function for processing unlocked security deposit
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onProviderSecurityDepoUnlocked(callback: onProviderSecurityDepoUnlockedCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onProviderSecurityDepoUnlocked" });

        const subscription = contract.events
            .ProviderSecurityDepoUnlocked()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.auth,
                    <string>event.returnValues.amount,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }
}

// address -> AuthorityAccount
export type onProviderRegisteredCallback = (address: string, block?: BlockInfo) => void;
export type onProviderModifiedCallback = (address: string, block?: BlockInfo) => void;
export type onProviderSecurityDepoRefilledCallback = (address: string, amount: string, block?: BlockInfo) => void;
export type onProviderSecurityDepoUnlockedCallback = (address: string, amount: string, block?: BlockInfo) => void;
export type onProviderViolationRateIncrementedCallback = (
    address: string,
    newViolationRate: BigNumber,
    block?: BlockInfo,
) => void;

export default ProviderRegistry;
