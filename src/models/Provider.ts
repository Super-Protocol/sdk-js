import rootLogger from "../logger";
import { Contract, ContractAbi, AbiFragment } from "web3";
import appJSON from "../contracts/app.json";
import { checkIfActionAccountInitialized, tupleToObject, objectToTuple } from "../utils";
import { ProviderInfo, ProviderInfoStructure } from "../types/Provider";
import { Origins, OriginsStructure } from "../types/Origins";
import Superpro from "../staticModels/Superpro";
import { TransactionOptions } from "../types/Web3";
import BlockchainConnector from "../connectors/BlockchainConnector";
import TxManager from "../utils/TxManager";
import Consensus from "../staticModels/Consensus";

class Provider {
    private static contract: Contract<ContractAbi>;
    private logger: typeof rootLogger;

    public providerInfo?: ProviderInfo;
    public violationRate?: number;
    public authority?: string;
    public valueOffers?: string[];
    public teeOffers?: string[];
    public origins?: Origins;
    public providerId: string;

    constructor(providerId: string) {
        this.providerId = providerId;
        if (!Provider.contract) {
            Provider.contract = BlockchainConnector.getInstance().getContract();
        }

        this.logger = rootLogger.child({
            className: "Provider",
            providerId: this.providerId.toString(),
        });
    }

    private checkInitProvider(transactionOptions: TransactionOptions) {
        if (transactionOptions?.web3) {
            return new transactionOptions.web3.eth.Contract(<AbiFragment[]>appJSON.abi, Superpro.address);
        }
    }

    public async modify(providerInfo: ProviderInfo, transactionOptions?: TransactionOptions): Promise<void> {
        transactionOptions ?? this.checkInitProvider(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        const providerInfoParams = objectToTuple(providerInfo, ProviderInfoStructure);
        await TxManager.execute(Provider.contract.methods.modifyProvider, [providerInfoParams], transactionOptions);
    }

    /**
     * Function for fetching provider info from blockchain
     */
    public async getInfo(): Promise<ProviderInfo> {
        const providerInfoParams = await Provider.contract.methods.getProviderInfo(this.providerId).call();
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
        this.valueOffers = await Provider.contract.methods.getProviderValueOffers(this.providerId).call();

        return this.valueOffers!;
    }

    /**
     * Function for fetching all TEE offers for this provider
     */
    public async getTeeOffers(): Promise<string[]> {
        this.teeOffers = await Provider.contract.methods.getProviderTeeOffers(this.providerId).call();

        return this.teeOffers!;
    }

    /**
     * Function for fetching violationRate for this provider
     */
    public async getViolationRate(): Promise<number> {
        this.violationRate = +(await Provider.contract.methods.getProviderViolationRate(this.providerId).call());

        return this.violationRate!;
    }

    /**
     * Fetch new Origins (createdDate, createdBy, modifiedDate and modifiedBy)
     */
    public async getOrigins(): Promise<Origins> {
        let origins = await Provider.contract.methods.getProviderOrigins(this.providerId).call();

        // Converts blockchain array into object
        origins = tupleToObject(origins, OriginsStructure);

        // Convert blockchain time seconds to js time milliseconds
        origins.createdDate = +origins.createdDate * 1000;
        origins.modifiedDate = +origins.modifiedDate * 1000;

        return (this.origins = origins);
    }

    public async isProviderBanned(): Promise<boolean> {
        const violationRate = await this.getViolationRate();
        const { CONSENSUS_MAX_PENALTIES } = await Consensus.getConstants();

        return violationRate >= CONSENSUS_MAX_PENALTIES;
    }

    public async getOrdersLockedProfitList(): Promise<string[]> {
        return Provider.contract.methods.getOrdersLockedProfitList(this.providerId);
    }

    public async getTcbLockedProfitList(): Promise<string[]> {
        return Provider.contract.methods.getTcbLockedProfitList(this.providerId);
    }
}

export default Provider;
