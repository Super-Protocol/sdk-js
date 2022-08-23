import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import appJSON from "../contracts/app.json";
import store from "../store";
import { checkIfActionAccountInitialized, checkIfInitialized, tupleToObject } from "../utils";
import { TeeOfferInfo, TeeOfferInfoStructure } from "../types/TeeOffer";
import { TransactionOptions } from "../types/Web3";
import { OfferType } from "../types/Offer";
import { Origins, OriginsStructure } from "../types/Origins";
import Superpro from "../staticModels/Superpro";
import TxManager from "../utils/TxManager";

class TeeOffer {
    private static contract: Contract;
    private logger: typeof rootLogger;

    public id: string;
    public violationRate?: number;
    public totalLocked?: number;
    public offerInfo?: TeeOfferInfo;
    public type?: OfferType;
    public providerAuthority?: string;
    public provider?: string;
    public disabledAfter?: number;
    public tcb?: string;
    public closingPrice?: string;
    public tlbAddedTime?: number;
    public tcbAddedTime?: number;
    public origins?: Origins;
    public isCancelable?: boolean;

    constructor(offerId: string) {
        checkIfInitialized();

        this.id = offerId;
        if (!TeeOffer.contract) {
            TeeOffer.contract = new store.web3!.eth.Contract(<AbiItem[]>appJSON.abi, Superpro.address);
        }

        this.logger = rootLogger.child({ className: "TeeOffer" });
    }

    /**
     * @returns True if offer is cancelable.
     */
    public async isOfferCancelable(): Promise<boolean> {
        this.isCancelable = await TeeOffer.contract.methods.isOfferCancelable(this.id).call();
        return this.isCancelable!;
    }

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private checkInitTeeOffer(transactionOptions: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();

            return new transactionOptions.web3.eth.Contract(<AbiItem[]>appJSON.abi, Superpro.address);
        }
    }

    /**
     * Function for fetching TEE offer info from blockchain
     */
    public async getInfo(): Promise<TeeOfferInfo> {
        const [, , teeOfferInfoParams] = await TeeOffer.contract.methods.getTeeOffer(this.id).call();

        return (this.offerInfo = tupleToObject(teeOfferInfoParams, TeeOfferInfoStructure));
    }

    /**
     * Function for fetching TEE offer provider from blockchain
     */
    public async getProvider(): Promise<string> {
        this.providerAuthority = await TeeOffer.contract.methods.getOfferProviderAuthority(this.id).call();
        return this.providerAuthority!;
    }

    /**
     * Function for fetching TEE offer provider authority account from blockchain
     */
    public async getProviderAuthority(): Promise<string> {
        this.providerAuthority = await TeeOffer.contract.methods.getOfferProviderAuthority(this.id).call();
        return this.providerAuthority!;
    }

    /**
     * Fetch offer type from blockchain (works for TEE and Value offers)
     */
    public async getOfferType(): Promise<OfferType> {
        this.type = await TeeOffer.contract.methods.getOfferType(this.id).call();

        return this.type!;
    }

    /**
     * Function for fetching offer provider from blockchain
     */
    public async getDisabledAfter(): Promise<number> {
        this.disabledAfter = +(await TeeOffer.contract.methods.getOfferDisabledAfter(this.id).call());

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
     * Function for offer closing price calculation
     */
     public async getClosingPrice(startDate: number): Promise<string> {
        this.closingPrice = await TeeOffer.contract.methods.getOfferClosingPrice(this.id, startDate, 0).call();
        return this.closingPrice!;
    }

    /**
     * Function for fetching last TLB addition time for this TEE offer
     */
    public async getLastTlbAddedTime(): Promise<number> {
        this.tlbAddedTime = await TeeOffer.contract.methods.getTeeOfferLastTlbAddedTime().call();
        return this.tlbAddedTime!;
    }

    /**
     * Function for fetching last TCB addition time for this TEE offer
     */
    public async getLastTcbAddedTime(): Promise<number> {
        // this.tcbAddedTime = await TeeOffer.contract.methods.getLastTcbAddedTime().call();
        // return this.tcbAddedTime!;
        // TODO: stub
        return 0;
    }

    /**
     * Function for fetching violationRate for this TEE offer
     */
    public async getViolationRate(): Promise<number> {
        this.violationRate = await TeeOffer.contract.methods.getTeeOfferViolationRate(this.id).call();
        return this.violationRate!;
    }

    /**
     * Function for fetching amount of total locked tokens
     */
    public async getTotalLocked(): Promise<number> {
        // this.totalLocked = await TeeOffer.contract.methods.getTotalLocked().call();
        // return this.totalLocked!;
        // TODO: stub
        return 0;
    }

    /**
     * Fetch new Origins (createdDate, createdBy, modifiedDate and modifiedBy)
     */
    public async getOrigins(): Promise<Origins> {
        let origins = await TeeOffer.contract.methods.getOfferOrigins(this.id).call();

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
        transactionOptions ?? this.checkInitTeeOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(TeeOffer.contract.methods.setTeeOfferTlb, [this.id, tlb], transactionOptions);
        if (this.offerInfo) this.offerInfo.tlb = tlb;
    }

    /**
     * Updates name in order info
     * @param name - new name
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async setName(name: string, transactionOptions?: TransactionOptions): Promise<void> {
        transactionOptions ?? this.checkInitTeeOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(TeeOffer.contract.methods.setOfferName, [this.id, name], transactionOptions);
        if (this.offerInfo) this.offerInfo.name = name;
    }

    /**
     * Updates description in order info
     * @param description - new description
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async setDescription(description: string, transactionOptions?: TransactionOptions): Promise<void> {
        transactionOptions ?? this.checkInitTeeOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(
            TeeOffer.contract.methods.setOfferDescription,
            [this.id, description],
            transactionOptions,
        );
        if (this.offerInfo) this.offerInfo.description = description;
    }

    /**
     * Updates argsPublicKey and argsPublicKeyAlgo in order info
     * @param argsPublicKey - new argsPublicKey
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async setKeys(argsPublicKey: string, transactionOptions?: TransactionOptions): Promise<void> {
        transactionOptions ?? this.checkInitTeeOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(
            TeeOffer.contract.methods.setOfferPublicKey,
            [this.id, argsPublicKey],
            transactionOptions,
        );
        if (this.offerInfo) {
            this.offerInfo.argsPublicKey = argsPublicKey;
        }
    }

    /**
     * Function for disabling TEE offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async disable(transactionOptions?: TransactionOptions) {
        transactionOptions ?? this.checkInitTeeOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(TeeOffer.contract.methods.disableOffer, [this.id], transactionOptions);
    }

    /**
     * Function for enabling TEE offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async enable(transactionOptions?: TransactionOptions) {
        transactionOptions ?? this.checkInitTeeOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(TeeOffer.contract.methods.enableOffer, [this.id], transactionOptions);
    }
}

export default TeeOffer;
