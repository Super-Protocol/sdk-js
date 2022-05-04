import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import OffersJSON from "../contracts/Offers.json";
import store from "../store";
import { checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions, tupleToObject } from "../utils";
import { OfferInfo, OfferInfoStructure, OfferType } from "../types/Offer";
import { TransactionOptions } from "../types/Web3";
import { Origins, OriginsStructure } from "../types/Origins";
import Superpro from "../staticModels/Superpro";

class Offer {
    private contract: Contract;
    private logger: typeof rootLogger;

    public offerInfo?: OfferInfo;
    public provider?: string;
    public type?: OfferType;
    public providerAuthority?: string;
    public origins?: Origins;
    public offerId: number;

    constructor(offerId: number) {
        checkIfInitialized();

        this.offerId = offerId;
        this.contract = new store.web3!.eth.Contract(<AbiItem[]>OffersJSON.abi, Superpro.address);
        this.logger = rootLogger.child({ className: "Offer", offerId: this.offerId });
    }

    /**
     * Function for fetching offer info from blockchain
     */
    public async getInfo(): Promise<OfferInfo> {
        const orderInfoParams = await this.contract.methods.getValueOffer(this.offerId).call();
        return (this.offerInfo = tupleToObject(orderInfoParams[0], OfferInfoStructure));
    }

    /**
     * Function for fetching offer provider from blockchain (works for TEE and Value offers)
     */
    public async getProvider(): Promise<string> {
        return await this.contract.methods.getProviderAuthority();
    }

    /**
     * Fetch offer type from blockchain (works for TEE and Value offers)
     */
    public async getOfferType(): Promise<OfferType> {
        this.type = await this.contract.methods.getOfferType(this.offerId).call();
        return this.type!;
    }

    /**
     * Function for fetching TEE offer provider authority account from blockchain
     */
    public async getProviderAuthority(): Promise<string> {
        this.providerAuthority = await this.contract.methods.getOfferProviderAuthority(this.offerId).call();
        return this.providerAuthority!;
    }

    /**
     * Fetch new Origins (createdDate, createdBy, modifiedDate and modifiedBy)
     */
    public async getOrigins(): Promise<Origins> {
        let origins = await this.contract.methods.getOfferOrigins(this.offerId).call();

        // Converts blockchain array into object
        origins = tupleToObject(origins, OriginsStructure);

        // Convert blockchain time seconds to js time milliseconds
        origins.createdDate = +origins.createdDate * 1000;
        origins.modifiedDate = +origins.modifiedDate * 1000;

        return this.origins = origins;
    }

    /**
     * Function for disabling offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async disable(transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        await this.contract.methods.disableOffer(this.offerId).send(await createTransactionOptions(transactionOptions));
    }

    /**
     * Function for enabling offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async enable(transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        await this.contract.methods.enableOffer(this.offerId).send(await createTransactionOptions(transactionOptions));
    }

    /**
     * Checks if offer (offerAddress) match restrictions in this offer
     * @param offerAddress - address of offer what needs to be checked
     */
    public async isRestrictionsPermitThatOffer(offerAddress: string) {
        checkIfActionAccountInitialized();

        return await this.contract.methods.isOfferRestrictionsPermitOtherOffer(this.offerId, +offerAddress).call();
    }

    /**
     * Checks if this offer contains restrictions of a certain type
     * @param type - address of offer what needs to be checked
     */
    public async isRestrictedByOfferType(type: OfferType) {
        checkIfActionAccountInitialized();

        return await this.contract.methods.isOfferRestrictedByOfferType(this.offerId, type).call();
    }
}

export default Offer;
