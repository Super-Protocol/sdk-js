import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import OffersJSON from "../contracts/Offers.json";
import { checkIfActionAccountInitialized, checkIfInitialized, objectToTuple } from "../utils";
import { formatBytes32String } from "ethers/lib/utils";
import { ContractEvent, TransactionOptions } from "../types/Web3";
import { TeeOfferInfo, TeeOfferInfoStructure } from "../types/TeeOffer";
import { OfferType } from "../types/Offer";
import { OfferCreatedEvent } from "../types/Events";
import Superpro from "./Superpro";
import TxManager from "../utils/TxManager";

class TeeOffersFactory {
    private static contract: Contract;
    private static logger: typeof rootLogger;

    public static teeOffers?: string[];

    public static get address(): string {
        return Superpro.address;
    }
    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit(transactionOptions?: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();
            return new transactionOptions.web3.eth.Contract(<AbiItem[]>OffersJSON.abi, Superpro.address);
        }

        if (this.contract) return this.contract;
        checkIfInitialized();

        this.logger = rootLogger.child({ className: "TeeOffersFactory" });
        return this.contract = new store.web3!.eth.Contract(<AbiItem[]>OffersJSON.abi, Superpro.address);
    }

    /**
     * Function for fetching list of all TEE offers addresses
     */
    public static async getAllTeeOffers(): Promise<string[]> {
        this.checkInit();

        // TODO: offerId start at 1 in next smart-contract deployment
        const count = await this.contract.methods.getOffersCount().call();
        this.teeOffers = this.teeOffers || [];
        const teeOfffersSet = new Set(this.teeOffers);

        for (let offerId = teeOfffersSet.size; offerId < count; ++offerId) {
            const offerType = (await this.contract.methods.getOfferType(offerId).call()) as OfferType;
            if (offerType === OfferType.TeeOffer) {
                teeOfffersSet.add(offerId.toString());
            }
        }
        this.teeOffers = Array.from(teeOfffersSet);

        return this.teeOffers;
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
        externalId = "default",
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = this.checkInit(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        // Converts offer info to array of arrays (used in blockchain)
        const teeOfferInfoParams = objectToTuple(teeOfferInfo, TeeOfferInfoStructure);
        const formattedExternalId = formatBytes32String(externalId);
        await TxManager.execute(
            contract.methods.createTeeOffer,
            [providerAuthorityAccount, teeOfferInfoParams, formattedExternalId],
            transactionOptions,
        );
    }

    public static async getOffer(creator: string, externalId: string): Promise<OfferCreatedEvent> {
        const contract = this.checkInit();

        const filter = {
            creator,
            externalId: formatBytes32String(externalId),
        };
        const foundIds = await contract.getPastEvents("TeeOfferCreated", { filter });
        const notFound = { creator, externalId, offerId: -1 };
        const response: OfferCreatedEvent =
            foundIds.length > 0 ? (foundIds[0].returnValues as OfferCreatedEvent) : notFound;

        return response;
    }

    /**
     * Function for adding event listeners on TEE offer created event in TEE offers factory contract
     * @param callback - function for processing created TEE offer
     * @return unsubscribe - unsubscribe function from event
     */
    public static onTeeOfferCreated(callback: onTeeOfferCreatedCallback): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onTeeOfferCreated" });

        const subscription = this.contract.events
            .OfferCreated()
            .on("data", async (event: ContractEvent) => {
                callback(<string>event.returnValues.offerId);
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }
}

export type onTeeOfferCreatedCallback = (address: string) => void;

export default TeeOffersFactory;
