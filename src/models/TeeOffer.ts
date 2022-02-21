import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import TeeOfferJSON from "../contracts/TeeOffer.json";
import store from "../store";
import {checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions, tupleToObject} from "../utils";
import { TeeOfferInfo, TeeOfferInfoStructure } from "../types/TeeOffer";
import { TransactionOptions } from "../types/Web3";
import { OfferType } from "../types/Offer";
import { Origins, OriginsStructure } from "../types/Origins";

class TeeOffer {
    public address: string;
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

    constructor(address: string) {
        checkIfInitialized();

        this.address = address;
        this.contract = new store.web3!.eth.Contract(<AbiItem[]>TeeOfferJSON.abi, address);

        this.logger = rootLogger.child({ className: "TeeOffer", address });
    }

    /**
     * Function for fetching TEE offer info from blockchain
     */
    public async getInfo(): Promise<TeeOfferInfo> {
        let teeOfferInfoParams = await this.contract.methods.getInfo().call();
        return this.offerInfo = tupleToObject(teeOfferInfoParams, TeeOfferInfoStructure);
    }

    /**
     * Function for fetching TEE offer provider from blockchain
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
     * Function for fetching offer provider from blockchain
     */
    public async getDisabledAfter(): Promise<number> {
        this.disabledAfter = +await this.contract.methods.getDisabledAfter().call();
        return this.disabledAfter!;
    }

    /**
     * Function for fetching tcb provider from blockchain
     */
    public async getTcb(): Promise<string> {
        this.tcb = await this.contract.methods.getTcb().call();
        return this.tcb!;
    }

    /**
     * Function for fetching TLB provider from blockchain
     */
    public async getTlb(): Promise<string> {
        const tlb: string = await this.contract.methods.getTlb().call();
        if (this.offerInfo) this.offerInfo.tlb = tlb;
        return tlb;
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
        this.violationRate = await this.contract.methods.getViolationRate().call();
        return this.violationRate!;
    }

    /**
     * Function for fetching amount of total locked tokens
     */
    public async getTotalLocked(): Promise<number> {
        this.totalLocked = await this.contract.methods.getTotalLocked().call();
        return this.totalLocked!;
    }

    /**
     * Fetch new Origins (createdDate, createdBy, modifiedDate and modifiedBy)
     */
    public async getOrigins(): Promise<Origins> {
        let origins = await this.contract.methods.getOrigins().call();

        // Converts blockchain array into object
        origins = tupleToObject(origins, OriginsStructure);

        // Convert blockchain time seconds to js time milliseconds
        origins.createdDate = +origins.createdDate * 1000;
        origins.modifiedDate = +origins.modifiedDate * 1000;

        return this.origins = origins;
    }

    /**
     * Updates TLB in order info
     * @param tlb - new TLB
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async addTlb(tlb: string, transactionOptions?: TransactionOptions): Promise<void> {
        checkIfActionAccountInitialized();

        await this.contract.methods.addTlb(tlb).send(createTransactionOptions(transactionOptions));
        if (this.offerInfo) this.offerInfo.tlb = tlb;
    }

    /**
     * Updates name in order info
     * @param name - new name
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async setName(name: string, transactionOptions?: TransactionOptions): Promise<void> {
        checkIfActionAccountInitialized();

        await this.contract.methods.setName(name).send(createTransactionOptions(transactionOptions));
        if (this.offerInfo) this.offerInfo.name = name;
    }

    /**
     * Updates description in order info
     * @param description - new description
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async setDescription(description: string, transactionOptions?: TransactionOptions): Promise<void> {
        checkIfActionAccountInitialized();

        await this.contract.methods.setDescription(description).send(createTransactionOptions(transactionOptions));
        if (this.offerInfo) this.offerInfo.description = description;
    }

    /**
     * Updates argsPublicKey and argsPublicKeyAlgo in order info
     * @param argsPublicKey - new argsPublicKey
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async setKeys(
        argsPublicKey: string,
        transactionOptions?: TransactionOptions
    ): Promise<void> {
        checkIfActionAccountInitialized();

        await this.contract.methods
            .setKeys(argsPublicKey)
            .send(createTransactionOptions(transactionOptions));
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

        await this.contract.methods.disable().send(createTransactionOptions(transactionOptions));
    }

    /**
     * Function for enabling TEE offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async enable(transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        await this.contract.methods.enable().send(createTransactionOptions(transactionOptions));
    }
}

export default TeeOffer;
