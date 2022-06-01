import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import ProvidersJSON from "../contracts/Providers.json";
import ProvidersOffersJSON from "../contracts/ProvidersOffers.json";
import { checkIfInitialized, createTransactionOptions, checkIfActionAccountInitialized, objectToTuple } from "../utils";
import { ProviderInfo, ProviderInfoStructure } from "../types/Provider";
import { formatBytes32String } from "ethers/lib/utils";
import { ContractEvent, TransactionOptions } from "../types/Web3";
import Superpro from "./Superpro";
import Model from "../utils/Model";

class ProviderRegistry extends Model {
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
        return this.contract = new store.web3!.eth.Contract(<AbiItem[]>ProvidersJSON.abi, Superpro.address);
    }

    private static checkInitProvidersOffers(transactionOptions?: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();
            return new transactionOptions.web3.eth.Contract(<AbiItem[]>ProvidersOffersJSON.abi, Superpro.address);
        }

        if (this.contract) return this.contract;
        checkIfInitialized();

        this.logger = rootLogger.child({ className: "ProvidersOffers" });
        return this.contract = new store.web3!.eth.Contract(<AbiItem[]>ProvidersOffersJSON.abi, Superpro.address);
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
    public static async getSecurityDeposit(providerAuthority: string): Promise<number> {
        this.checkInitProviders();
        return +(await this.contract.methods.getProviderSecurityDeposit(providerAuthority).call());
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
        await this.execute(
            contract.methods.registerProvider,
            [providerInfoParams],
            await createTransactionOptions(transactionOptions),
        );
    }

    /**
     * Refills security deposit for provider
     * Call this function with provider authority account (in transactionOptions)
     * @param amount - amount of additional tokens
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async refillSecurityDeposit(amount: number, transactionOptions?: TransactionOptions): Promise<void> {
        const contract = this.checkInitProviders(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        await this.execute(
            contract.methods.refillProviderSecurityDepo,
            [amount],
            await createTransactionOptions(transactionOptions),
        );
    }

    /**
     * Return security deposit for provider
     * Call this function with provider authority account (in transactionOptions)
     * @param amount - amount of tokens to return
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async returnSecurityDeposit(amount: number, transactionOptions?: TransactionOptions): Promise<void> {
        const contract = this.checkInitProviders(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        await this.execute(
            contract.methods.returnProviderSecurityDepo,
            [amount],
            await createTransactionOptions(transactionOptions),
        );
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
}

export type onProviderRegisteredCallback = (address: string) => void;

export default ProviderRegistry;
