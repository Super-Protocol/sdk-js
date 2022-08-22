import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import ProvidersJSON from "../contracts/Providers.json";
import ProvidersOffersJSON from "../contracts/ProvidersOffers.json";
import { checkIfInitialized, checkIfActionAccountInitialized, objectToTuple } from "../utils";
import { ProviderInfo, ProviderInfoStructure } from "../types/Provider";
import { BigNumber } from "ethers";
import { ContractEvent, TransactionOptions } from "../types/Web3";
import Superpro from "./Superpro";
import TxManager from "../utils/TxManager";

class ProviderRegistry {
    private static contract: Contract;
    private static logger: typeof rootLogger;

    public static providers?: string[];

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInitProviders(transactionOptions?: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();

            return new transactionOptions.web3.eth.Contract(<AbiItem[]>ProvidersJSON.abi, Superpro.address);
        }

        if (this.contract) return this.contract;
        checkIfInitialized();

        this.logger = rootLogger.child({ className: "Providers" });

        return (this.contract = new store.web3!.eth.Contract(<AbiItem[]>ProvidersJSON.abi, Superpro.address));
    }

    private static checkInitProvidersOffers(transactionOptions?: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();

            return new transactionOptions.web3.eth.Contract(<AbiItem[]>ProvidersOffersJSON.abi, Superpro.address);
        }

        if (this.contract) return this.contract;
        checkIfInitialized();

        this.logger = rootLogger.child({ className: "ProvidersOffers" });

        return (this.contract = new store.web3!.eth.Contract(<AbiItem[]>ProvidersOffersJSON.abi, Superpro.address));
    }

    /**
     * Function for fetching list of all providers addresses
     */
    public static async getAllProviders(): Promise<string[]> {
        this.checkInitProviders();
        this.providers = await this.contract.methods.getProvidersAuths().call();

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
        this.checkInitProviders();

        return await this.contract.methods.getProviderSecurityDeposit(providerAuthority).call();
    }

    public static async isProviderRegistered(providerAuthority: string): Promise<boolean> {
        this.checkInitProviders();

        return await this.contract.methods.isProviderRegistered(providerAuthority).call();
    }

    /**
     * Reg new provider
     * @param providerInfo - data of new provider
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async registerProvider(
        providerInfo: ProviderInfo,
        externalId = "default",
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = this.checkInitProviders(transactionOptions);
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
        const contract = this.checkInitProviders(transactionOptions);
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
        const contract = this.checkInitProviders(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(contract.methods.returnProviderSecurityDepo, [amount], transactionOptions);
    }

    /**
     * Function for adding event listeners on provider registered event in provider registry
     * @param callback - function for processing new provider
     * @return unsubscribe - unsubscribe function from event
     */
    public static onProviderRegistered(callback: onProviderRegisteredCallback): () => void {
        this.checkInitProviders();
        const logger = this.logger.child({ method: "onProviderRegistered" });

        const subscription = this.contract.events
            .ProviderRegistred()
            .on("data", async (event: ContractEvent) => {
                callback(<string>event.returnValues.providerInfo);
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
        this.checkInitProviders();
        const logger = this.logger.child({ method: "onProviderModified" });

        const subscription = this.contract.events
            .ProviderModified()
            .on("data", async (event: ContractEvent) => {
                callback(<string>event.returnValues.auth);
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
        this.checkInitProviders();
        const logger = this.logger.child({ method: "onProviderViolationRateIncremented" });

        const subscription = this.contract.events
            .ProviderViolationRateIncremented()
            .on("data", async (event: ContractEvent) => {
                callback(<string>event.returnValues.auth, <BigNumber>event.returnValues.newViolationRate);
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
        this.checkInitProviders();
        const logger = this.logger.child({ method: "onProviderSecurityDepoRefilled" });

        const subscription = this.contract.events
            .ProviderSecurityDepoRefilled()
            .on("data", async (event: ContractEvent) => {
                callback(<string>event.returnValues.auth, <string>event.returnValues.amount);
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
        this.checkInitProviders();
        const logger = this.logger.child({ method: "onProviderSecurityDepoUnlocked" });

        const subscription = this.contract.events
            .ProviderSecurityDepoUnlocked()
            .on("data", async (event: ContractEvent) => {
                callback(<string>event.returnValues.auth, <string>event.returnValues.amount);
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }
}

// address -> AuthorityAccount
export type onProviderRegisteredCallback = (address: string) => void;
export type onProviderModifiedCallback = (address: string) => void;
export type onProviderViolationRateIncrementedCallback = (address: string, newViolationRate: BigNumber) => void;
export type onProviderSecurityDepoRefilledCallback = (address: string, amount: string) => void;
export type onProviderSecurityDepoUnlockedCallback = (address: string, amount: string) => void;

export default ProviderRegistry;
