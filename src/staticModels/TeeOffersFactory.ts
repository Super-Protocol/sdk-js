import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import TeeOffersFactoryJSON from "../contracts/TeeOffersFactory.json";
import { checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions } from "../utils";
import { TransactionOptions } from "../types/Web3";
import _ from "lodash";
import { TeeOfferInfo, TeeOfferInfoArguments } from "../types/TeeOffer";

class OffersFactory {
    public static address: string;
    private static contract: Contract;
    private static logger: typeof rootLogger;

    public static teeOffers?: string[];

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit() {
        if (this.contract) return;
        checkIfInitialized();

        this.contract = new store.web3!.eth.Contract(<AbiItem[]>TeeOffersFactoryJSON.abi, this.address);
        this.logger = rootLogger.child({ className: "TeeOffersFactory", address: this.address });
    }

    /**
     * Function for fetching list of all TEE offers addresses
     */
    public static async getAllTeeOffers(): Promise<string[]> {
        this.checkInit();
        this.teeOffers = await this.contract.methods.listAll().call();
        return this.teeOffers!;
    }

    /**
     * Creates new TEE offer
     * @param providerAuthorityAccount - address of authority account of provider
     * @param teeOfferInfo - data of new TEE offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async createTeeOffer(
        providerAuthorityAccount: string,
        teeOfferInfo: TeeOfferInfo,
        transactionOptions?: TransactionOptions
    ): Promise<void> {
        this.checkInit();
        checkIfActionAccountInitialized();

        // Converts offer info to array of arrays (used in blockchain)
        let teeOfferInfoParams = _.at(teeOfferInfo, TeeOfferInfoArguments);

        await this.contract.methods
            .create(providerAuthorityAccount, teeOfferInfoParams)
            .send(createTransactionOptions(transactionOptions));
    }
}

export default OffersFactory;
