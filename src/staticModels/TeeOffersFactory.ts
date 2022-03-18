import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import TeeOffersFactoryJSON from "../contracts/TeeOffersFactory.json";
import {
    checkIfActionAccountInitialized,
    checkIfInitialized,
    createTransactionOptions,
    objectToTuple
} from "../utils";
import { formatBytes32String } from 'ethers/lib/utils';
import { ContractEvent, TransactionOptions } from "../types/Web3";
import { TeeOfferInfo, TeeOfferInfoStructure } from "../types/TeeOffer";

class OffersFactory {
    public static address: string;
    private static contract: Contract;
    private static logger: typeof rootLogger;

    public static teeOffers?: string[];

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit(transactionOptions?: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();
            return new transactionOptions.web3.eth.Contract(<AbiItem[]>TeeOffersFactoryJSON.abi, this.address);
        }

        if (this.contract) return this.contract;
        checkIfInitialized();

        this.logger = rootLogger.child({ className: "OffersFactory", address: this.address });
        return this.contract = new store.web3!.eth.Contract(<AbiItem[]>TeeOffersFactoryJSON.abi, this.address);
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
        externalId = formatBytes32String('default'),
        transactionOptions?: TransactionOptions
    ): Promise<void> {
        const contract = this.checkInit(transactionOptions);
        checkIfActionAccountInitialized();

        // Converts offer info to array of arrays (used in blockchain)
        let teeOfferInfoParams = objectToTuple(teeOfferInfo, TeeOfferInfoStructure)
        await contract.methods
            .create(providerAuthorityAccount, teeOfferInfoParams, externalId)
            .send(await createTransactionOptions(transactionOptions));
    }

    /**
     * Function for adding event listeners on TEE offer created event in TEE offers factory contract
     * @param callback - function for processing created TEE offer
     * @return unsubscribe - unsubscribe function from event
     */
    public static onTeeOfferCreated(callback: onTeeOfferCreatedCallback): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onTeeOfferCreated" });

        let subscription = this.contract.events
            .TeeOfferCreated()
            .on("data", async (event: ContractEvent) => {
                callback(<string>event.returnValues.teeOffer);
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }
}

export type onTeeOfferCreatedCallback = (address: string) => void;

export default OffersFactory;
