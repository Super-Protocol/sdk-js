import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import OffersJSON from "../contracts/Offers.json";
import store from "../store";
import { checkIfActionAccountInitialized, checkIfInitialized, tupleToObject } from "../utils";
import { OfferInfo, OfferInfoStructure, OfferType } from "../types/Offer";
import { TransactionOptions } from "../types/Web3";
import { Origins, OriginsStructure } from "../types/Origins";
import Superpro from "../staticModels/Superpro";
import TxManager from "../utils/TxManager";

class Offer {
    private static contract: Contract;
    private logger: typeof rootLogger;

    public offerInfo?: OfferInfo;
    public provider?: string;
    public type?: OfferType;
    public providerAuthority?: string;
    public origins?: Origins;
    public id: string;
    public disabledAfter?: number;
    public closingPrice?: string;

    constructor(offerId: string) {
        checkIfInitialized();

        this.id = offerId;
        if (!Offer.contract) {
            Offer.contract = new store.web3!.eth.Contract(<AbiItem[]>OffersJSON.abi, Superpro.address);            
        }
        this.logger = rootLogger.child({ className: "Offer", offerId: this.id });
    }

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private checkInitOffer(transactionOptions: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();

            return new transactionOptions.web3.eth.Contract(<AbiItem[]>OffersJSON.abi, Superpro.address);
        }
    }

    /**
     * Function for fetching offer info from blockchain
     */
    public async getInfo(): Promise<OfferInfo> {
        const [, , orderInfoParams] = await Offer.contract.methods.getValueOffer(this.id).call();

        return (this.offerInfo = tupleToObject(orderInfoParams, OfferInfoStructure));
    }

    /**
     * Function for fetching offer provider from blockchain (works for TEE and Value offers)
     */
    public async getProvider(): Promise<string> {
        this.provider = await Offer.contract.methods.getOfferProviderAuthority(this.id).call();
        return this.provider!;
    }

    /**
     * Fetch offer type from blockchain (works for TEE and Value offers)
     */
    public async getOfferType(): Promise<OfferType> {
        this.type = await Offer.contract.methods.getOfferType(this.id).call();
        return this.type!;
    }

    /**
     * Function for fetching TEE offer provider authority account from blockchain
     */
    public async getProviderAuthority(): Promise<string> {
        this.providerAuthority = await Offer.contract.methods.getOfferProviderAuthority(this.id).call();
        return this.providerAuthority!;
    }

    /**
     * Fetch new Origins (createdDate, createdBy, modifiedDate and modifiedBy)
     */
    public async getOrigins(): Promise<Origins> {
        let origins = await Offer.contract.methods.getOfferOrigins(this.id).call();

        // Converts blockchain array into object
        origins = tupleToObject(origins, OriginsStructure);

        // Convert blockchain time seconds to js time milliseconds
        origins.createdDate = +origins.createdDate * 1000;
        origins.modifiedDate = +origins.modifiedDate * 1000;

        return (this.origins = origins);
    }

    /**
     * Function for offer closing price calculation
     */
     public async getOfferClosingPrice(): Promise<string> {
        this.closingPrice = await Offer.contract.methods.getOfferClosingPrice().call();
        return this.closingPrice!;
    }

    public async isOfferExists(): Promise<boolean> {
        return await Offer.contract.methods.isOfferExists(this.id).call();
    }

    /**
     * Function for disabling offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async disable(transactionOptions?: TransactionOptions) {
        transactionOptions ?? this.checkInitOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(Offer.contract.methods.disableOffer, [this.id], transactionOptions);
    }

    /**
     * Function for enabling offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async enable(transactionOptions?: TransactionOptions) {
        transactionOptions ?? this.checkInitOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(Offer.contract.methods.enableOffer, [this.id], transactionOptions);
    }

    /**
     * Checks if offer (offerAddress) match restrictions in this offer
     * @param offerAddress - address of offer what needs to be checked
     */
    public async isRestrictionsPermitThatOffer(offerAddress: string) {
        return await Offer.contract.methods.isOfferRestrictionsPermitOtherOffer(this.id, +offerAddress).call();
    }

    /**
     * Checks if this offer contains restrictions of a certain type
     * @param type - address of offer what needs to be checked
     */
    public async isRestrictedByOfferType(type: OfferType) {
        return await Offer.contract.methods.isOfferRestrictedByOfferType(this.id, type).call();
    }

    /**
     * Function for fetching offer provider from blockchain
     */
    public async getDisabledAfter(): Promise<number> {
        this.disabledAfter = +(await Offer.contract.methods.getOfferDisabledAfter(this.id).call());

        return this.disabledAfter!;
    }
}

export default Offer;
