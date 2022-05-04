import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import OffersJSON from "../contracts/Offers.json";
import store from "../store";
import { checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions, tupleToObject } from "../utils";
import { TeeOfferInfo, TeeOfferInfoStructure } from "../types/TeeOffer";
import { TransactionOptions } from "../types/Web3";
import { OfferType } from "../types/Offer";
import { Origins, OriginsStructure } from "../types/Origins";
import Superpro from "../staticModels/Superpro";

class TeeOffer {
    private contract: Contract;
    private logger: typeof rootLogger;

    public violationRate?: number;
    public totalLocked?: number;
    public offerInfo?: TeeOfferInfo;
    public type?: OfferType;
    public provider?: string;
    public disabledAfter?: number;
    public tcb?: string;
    public tlbAddedTime?: number;
    public tcbAddedTime?: number;
    public origins?: Origins;
    public offerId: number;

    constructor(offerId: string) {
        checkIfInitialized();

        this.offerId = +offerId;
        this.contract = new store.web3!.eth.Contract(<AbiItem[]>OffersJSON.abi, Superpro.address);

        this.logger = rootLogger.child({ className: "TeeOffer" });
    }

    /**
     * Function for fetching TEE offer info from blockchain
     */
    public async getInfo(): Promise<TeeOfferInfo> {
        const [teeOfferInfoParams, ,] = await this.contract.methods.getTeeOffer().call();

        return (this.offerInfo = tupleToObject(teeOfferInfoParams, TeeOfferInfoStructure));
    }

    /**
     * Function for fetching TEE offer provider from blockchain
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
     * Function for fetching offer provider from blockchain
     */
    public async getDisabledAfter(): Promise<number> {
        this.disabledAfter = +(await this.contract.methods.getOfferDisabledAfter(this.offerId).call());

        return this.disabledAfter!;
    }

    /**
     * Function for fetching tcb provider from blockchain
     */
    public async getTcb(): Promise<string> {
        const offerInfo = await this.getInfo();
        return offerInfo.tcb;
    }

    /**
     * Function for fetching TLB provider from blockchain
     */
    public async getTlb(): Promise<string> {
        const offerInfo = await this.getInfo();
        return offerInfo.tlb;
    }

    /**
     * Function for fetching last TLB addition time for this TEE offer
     */
    public async getLastTlbAddedTime(): Promise<number> {
        this.tlbAddedTime = await this.contract.methods.getLastTlbAddedTime().call();
        return this.tlbAddedTime!;
    }

    /**
     * Function for fetching last TCB addition time for this TEE offer
     */
    public async getLastTcbAddedTime(): Promise<number> {
        this.tcbAddedTime = await this.contract.methods.getLastTcbAddedTime().call();
        return this.tcbAddedTime!;
    }

    /**
     * Function for fetching violationRate for this TEE offer
     */
    public async getViolationRate(): Promise<number> {
        this.violationRate = await this.contract.methods.getTeeOfferViolationRate(this.offerId).call();
        return this.violationRate!;
    }

    /**
     * Function for fetching amount of total locked tokens
     */
    public async getTotalLocked(): Promise<number> {
        // this.totalLocked = await this.contract.methods.getTotalLocked().call();
        // return this.totalLocked!;
        // TODO: stub
        return 0;
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

        return (this.origins = origins);
    }

    /**
     * Updates TLB in order info
     * @param tlb - new TLB
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async addTlb(tlb: string, transactionOptions?: TransactionOptions): Promise<void> {
        checkIfActionAccountInitialized();

        await this.contract.methods
            .setTeeOfferTlb(this.offerId, tlb)
            .send(await createTransactionOptions(transactionOptions));
        if (this.offerInfo) this.offerInfo.tlb = tlb;
    }

    /**
     * Updates name in order info
     * @param name - new name
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async setName(name: string, transactionOptions?: TransactionOptions): Promise<void> {
        checkIfActionAccountInitialized();

        await this.contract.methods
            .setOfferName(this.offerId, name)
            .send(await createTransactionOptions(transactionOptions));
        if (this.offerInfo) this.offerInfo.name = name;
    }

    /**
     * Updates description in order info
     * @param description - new description
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async setDescription(description: string, transactionOptions?: TransactionOptions): Promise<void> {
        checkIfActionAccountInitialized();

        await this.contract.methods
            .setOfferDescription(this.offerId, description)
            .send(await createTransactionOptions(transactionOptions));
        if (this.offerInfo) this.offerInfo.description = description;
    }

    /**
     * Updates argsPublicKey and argsPublicKeyAlgo in order info
     * @param argsPublicKey - new argsPublicKey
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async setKeys(argsPublicKey: string, transactionOptions?: TransactionOptions): Promise<void> {
        checkIfActionAccountInitialized();

        await this.contract.methods
            .setOfferPublicKey(this.offerId, argsPublicKey)
            .send(await createTransactionOptions(transactionOptions));
        if (this.offerInfo) {
            this.offerInfo.argsPublicKey = argsPublicKey;
        }
    }

    /**
     * Function for disabling TEE offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async disable(transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        await this.contract.methods.disableOffer(this.offerId).send(await createTransactionOptions(transactionOptions));
    }

    /**
     * Function for enabling TEE offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async enable(transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        await this.contract.methods.enableOffer(this.offerId).send(await createTransactionOptions(transactionOptions));
    }
}

export default TeeOffer;
