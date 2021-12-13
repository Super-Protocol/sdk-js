import { Contract } from "web3-eth-contract";
import _ from "lodash";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import TeeOfferJSON from "../contracts/TeeOffer.json";
import store from "../store";
import { checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions } from "../utils";
import { TeeOfferInfo, TeeOfferInfoArguments } from "../types/TeeOffer";
import { TransactionOptions } from "../types/Web3";
import { OfferType } from "../types/Offer";

class TeeOffer {
    public address: string;
    private contract: Contract;
    private logger: typeof rootLogger;

    public violationRate?: number;
    public offerInfo?: TeeOfferInfo;
    public type?: OfferType;
    public provider?: string;
    public disabledAfter?: number;
    public tcb?: string;

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
        return (this.offerInfo = <TeeOfferInfo>_.zipObject(TeeOfferInfoArguments, teeOfferInfoParams));
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
        this.disabledAfter = await this.contract.methods.getDisalbedAfter().call();
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
     * Function for fetching violationRate for this TEE offer
     */
    public async getViolationRate(): Promise<number> {
        this.violationRate = await this.contract.methods.getViolationRate().call();
        return this.violationRate!;
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
