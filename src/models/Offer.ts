import { Contract } from "web3-eth-contract";
import _ from "lodash";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import OfferJSON from "../contracts/Offer.json";
import store from "../store";
import { checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions } from "../utils";
import { OfferInfo, OfferInfoArguments, OfferType } from "../types/Offer";
import { TransactionOptions } from "../types/Web3";

class Offer {
    public address: string;
    private contract: Contract;
    private logger: typeof rootLogger;

    public offerInfo?: OfferInfo;
    public provider?: string;
    public type?: OfferType;
    public providerAuthority?: string;

    constructor(address: string) {
        checkIfInitialized();

        this.address = address;
        this.contract = new store.web3!.eth.Contract(<AbiItem[]>OfferJSON.abi, address);

        this.logger = rootLogger.child({ className: "Offer", address });
    }

    /**
     * Function for fetching offer info from blockchain
     */
    public async getInfo(): Promise<OfferInfo> {
        let orderInfoParams = await this.contract.methods.getInfo().call();

        // Converts blockchain array into object
        orderInfoParams = _.zipObject(OfferInfoArguments, orderInfoParams);

        return (this.offerInfo = <OfferInfo>orderInfoParams);
    }

    /**
     * Function for fetching offer provider from blockchain (works for TEE and Value offers)
     */
    public async getProvider(): Promise<string> {
        this.provider = await this.contract.methods.getProvider().call();
        return this.provider!;
    }

    /**
     * Fetch offer type from blockchain (works for TEE and Value offers)
     */
    public async getOfferType(): Promise<OfferType> {
        this.type = await this.contract.methods.getOfferType().call();
        return this.type!;
    }

    /**
     * Function for fetching TEE offer provider authority account from blockchain
     */
    public async getProviderAuthority(): Promise<string> {
        this.providerAuthority = await this.contract.methods.getProviderAuthority().call();
        return this.providerAuthority!;
    }
    /**
     * Function for disabling offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async disable(transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        await this.contract.methods.disable().send(createTransactionOptions(transactionOptions));
    }

    /**
     * Function for enabling offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async enable(transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        await this.contract.methods.enable().send(createTransactionOptions(transactionOptions));
    }

    /**
     * Checks if offer (offerAddress) match restrictions in this offer
     * @param offerAddress - address of offer what needs to be checked
     */
    public async isRestrictionsPermitThatOffer(offerAddress: string) {
        checkIfActionAccountInitialized();

        return await this.contract.methods.isRestrictionsPermitThatOffer(offerAddress).call();
    }

    /**
     * Checks if this offer contains restrictions of a certain type
     * @param type - address of offer what needs to be checked
     */
    public async isRestrictedByOfferType(type: OfferType) {
        checkIfActionAccountInitialized();

        return await this.contract.methods.isRestrictedByOfferType(type).call();
    }
}

export default Offer;
