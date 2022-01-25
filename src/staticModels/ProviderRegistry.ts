import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import ProviderRegistryJSON from "../contracts/ProviderRegistry.json";
import { checkIfInitialized, createTransactionOptions, checkIfActionAccountInitialized } from "../utils";
import { formatBytes32String } from 'ethers/lib/utils';
import { ProviderInfo } from "../types/Provider";
import { TransactionOptions } from "../types/Web3";

class ProviderRegistry {
    public static address: string;
    private static contract: Contract;
    private static logger: typeof rootLogger;

    public static providers?: string[];

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit() {
        if (this.contract) return;
        checkIfInitialized();

        this.contract = new store.web3!.eth.Contract(<AbiItem[]>ProviderRegistryJSON.abi, this.address);
        this.logger = rootLogger.child({ className: "ProviderRegistry", address: this.address });
    }

    /**
     * Function for fetching list of all providers addresses
     */
    public static async getAllProviders(): Promise<string[]> {
        this.checkInit();
        this.providers = await this.contract.methods.listAll().call();
        return this.providers!;
    }

    /**
     * Fetch provider address by provider authority account
     */
    public static async get(providerAuthority: string): Promise<string> {
        this.checkInit();
        return await this.contract.methods.get(providerAuthority).call();
    }

    /**
     * Fetch provider security deposit by provider authority account
     */
    public static async getSecurityDeposit(providerAuthority: string): Promise<number> {
        this.checkInit();
        return +(await this.contract.methods.getSecurityDeposit(providerAuthority).call());
    }

    /**
     * Reg new provider
     * @param providerInfo - data of new provider
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async registerProvider(
        providerInfo: ProviderInfo,
        externalId = formatBytes32String('default'),
        transactionOptions?: TransactionOptions
    ): Promise<void> {
        this.checkInit();
        checkIfActionAccountInitialized();
        await this.contract.methods.register(providerInfo, externalId).send(createTransactionOptions(transactionOptions));
    }

    /**
     * Refills security deposit for provider
     * Call this function with provider authority account (in transactionOptions)
     * @param amount - amount of additional tokens
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async refillSecurityDeposit(amount: number, transactionOptions?: TransactionOptions): Promise<void> {
        this.checkInit();
        checkIfActionAccountInitialized();
        await this.contract.methods.refillSecurityDepo(amount).send(createTransactionOptions(transactionOptions));
    }

    /**
     * Return security deposit for provider
     * Call this function with provider authority account (in transactionOptions)
     * @param amount - amount of tokens to return
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async returnSecurityDeposit(amount: number, transactionOptions?: TransactionOptions): Promise<void> {
        this.checkInit();
        checkIfActionAccountInitialized();
        await this.contract.methods.returnSecurityDepo(amount).send(createTransactionOptions(transactionOptions));
    }
}

export default ProviderRegistry;
