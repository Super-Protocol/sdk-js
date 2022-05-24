import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import ProvidersJSON from "../contracts/Providers.json";
import ProvidersOffersJSON from "../contracts/ProvidersOffers.json";
import store from "../store";
import { checkIfInitialized, tupleToObject } from "../utils";
import { ProviderInfo, ProviderInfoStructure } from "../types/Provider";
import { Origins, OriginsStructure } from "../types/Origins";
import Superpro from "../staticModels/Superpro";

class Provider {
    private contractProviders: Contract;
    private contractProvidersOffers: Contract;
    private logger: typeof rootLogger;

    public providerInfo?: ProviderInfo;
    public violationRate?: number;
    public authority?: string;
    public valueOffers?: string[];
    public teeOffers?: string[];
    public origins?: Origins;
    public providerId: string;

    constructor(providerId: string) {
        checkIfInitialized();

        this.providerId = providerId;
        this.contractProviders = new store.web3!.eth.Contract(<AbiItem[]>ProvidersJSON.abi, Superpro.address);
        this.contractProvidersOffers = new store.web3!.eth.Contract(
            <AbiItem[]>ProvidersOffersJSON.abi,
            Superpro.address,
        );

        this.logger = rootLogger.child({
            className: "Provider",
            providerId: this.providerId.toString(),
        });
    }

    /**
     * Function for fetching provider info from blockchain
     */
    public async getInfo(): Promise<ProviderInfo> {
        const providerInfoParams = await this.contractProviders.methods.getProviderInfo(this.providerId).call();
        this.providerInfo = tupleToObject(providerInfoParams, ProviderInfoStructure);

        return this.providerInfo;
    }

    /**
     * Function for fetching provider authority address from blockchain
     */
    public async getAuthority(): Promise<string> {
        return this.providerId.toString();
    }

    /**
     * Function for fetching all value offers for this provider
     */
    public async getValueOffers(): Promise<string[]> {
        this.valueOffers = await this.contractProvidersOffers.methods.getProviderValueOffers(this.providerId).call();

        return this.valueOffers!;
    }

    /**
     * Function for fetching all TEE offers for this provider
     */
    public async getTeeOffers(): Promise<string[]> {
        this.teeOffers = await this.contractProvidersOffers.methods.getProviderTeeOffers(this.providerId).call();

        return this.teeOffers!;
    }

    /**
     * Function for fetching violationRate for this provider
     */
    public async getViolationRate(): Promise<number> {
        this.violationRate = await this.contractProviders.methods.getProviderViolationRate(this.providerId).call();

        return this.violationRate!;
    }

    /**
     * Fetch new Origins (createdDate, createdBy, modifiedDate and modifiedBy)
     */
    public async getOrigins(): Promise<Origins> {
        let origins = await this.contractProviders.methods.getProviderOrigins(this.providerId).call();

        // Converts blockchain array into object
        origins = tupleToObject(origins, OriginsStructure);

        // Convert blockchain time seconds to js time milliseconds
        origins.createdDate = +origins.createdDate * 1000;
        origins.modifiedDate = +origins.modifiedDate * 1000;

        return (this.origins = origins);
    }
}

export default Provider;
