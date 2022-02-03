import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import OffersFactoryJSON from "../contracts/OffersFactory.json";
import {
    checkIfActionAccountInitialized,
    checkIfInitialized,
    createTransactionOptions,
    objectToTuple,
} from "../utils";
import { OfferInfo, OfferInfoStructure } from "../types/Offer";
import { formatBytes32String } from 'ethers/lib/utils';
import { TransactionOptions } from "../types/Web3";

class OffersFactory {
    public static address: string;
    private static contract: Contract;
    private static logger: typeof rootLogger;

    public static offers?: string[];

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit() {
        if (this.contract) return;
        checkIfInitialized();

        this.contract = new store.web3!.eth.Contract(<AbiItem[]>OffersFactoryJSON.abi, this.address);
        this.logger = rootLogger.child({ className: "OffersFactory", address: this.address });
    }

    /**
     * Function for fetching list of all offers addresses
     */
    public static async getAllOffers(): Promise<string[]> {
        this.checkInit();

        this.offers = await this.contract.methods.getOffers().call();
        return this.offers!;
    }

    /**
     * Creates new offer
     * @param providerAuthorityAccount - address of authority account of provider
     * @param offerInfo - data of new offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async createOffer(
        providerAuthorityAccount: string,
        offerInfo: OfferInfo,
        externalId = formatBytes32String('default'),
        transactionOptions?: TransactionOptions
    ): Promise<void> {
        this.checkInit();
        checkIfActionAccountInitialized();

        const offerInfoParams = objectToTuple(offerInfo, OfferInfoStructure);
        await this.contract.methods
            .create(providerAuthorityAccount, offerInfoParams, externalId)
            .send(createTransactionOptions(transactionOptions));
    }
}

export default OffersFactory;
