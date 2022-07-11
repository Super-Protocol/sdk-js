import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import OffersJSON from "../contracts/Offers.json";
import { checkIfActionAccountInitialized, checkIfInitialized, objectToTuple } from "../utils";
import { OfferInfo, OfferInfoV1, OfferInfoStructure, OfferType } from "../types/Offer";
import { formatBytes32String } from "ethers/lib/utils";
import { ContractEvent, TransactionOptions } from "../types/Web3";
import { OfferCreatedEvent } from "../types/Events";
import Superpro from "./Superpro";
import TxManager from "../utils/TxManager";

class OffersFactory {
    private static contract: Contract;
    private static logger: typeof rootLogger;

    public static offers?: string[];

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

        this.logger = rootLogger.child({ className: "OffersFactory" });

        return (this.contract = new store.web3!.eth.Contract(<AbiItem[]>OffersJSON.abi, Superpro.address));
    }

    /**
     * Function for fetching list of all offers addresses
     */
    public static async getAllOffers(): Promise<string[]> {
        this.checkInit();

        const count = await this.contract.methods.getOffersTotalCount().call();
        this.offers = this.offers || [];
        const offersSet = new Set(this.offers);

        for (let offerId = offersSet.size + 1; offerId <= count; ++offerId) {
            const offerType = (await this.contract.methods.getOfferType(offerId).call()) as OfferType;
            if (offerType !== OfferType.TeeOffer) {
                offersSet.add(offerId.toString());
            }
        }
        this.offers = Array.from(offersSet);

        return this.offers;
    }

    /**
     * Creates new offer
     * @param providerAuthorityAccount - address of authority account of provider
     * @param offerInfo - data of new offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async createOffer(
        providerAuthorityAccount: string,
        offerInfoV1: OfferInfoV1,
        externalId = "default",
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = this.checkInit(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        delete offerInfoV1.disabledAfter;
        const offerInfo: OfferInfo = offerInfoV1;

        const offerInfoParams = objectToTuple(offerInfo, OfferInfoStructure);
        const formattedExternalId = formatBytes32String(externalId);
        await TxManager.execute(
            contract.methods.createValueOffer,
            [providerAuthorityAccount, offerInfoParams, formattedExternalId],
            transactionOptions,
        );
    }

    public static async getOffer(creator: string, externalId: string): Promise<OfferCreatedEvent> {
        const contract = this.checkInit();
        const filter = {
            creator,
            externalId: formatBytes32String(externalId),
        };
        const foundIds = await contract.getPastEvents("OfferCreated", { filter });
        const response: OfferCreatedEvent =
            foundIds.length > 0
                ? (foundIds[0].returnValues as OfferCreatedEvent)
                : {
                      creator,
                      externalId,
                      offerId: '-1',
                  };

        return response;
    }

    /**
     * Function for adding event listeners on offer created event in offers factory contract
     * @param callback - function for processing created offer
     * @return unsubscribe - unsubscribe function from event
     */
    public static onOfferCreated(callback: onOfferCreatedCallback): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onOfferCreated" });

        const subscription = this.contract.events
            .OfferCreated()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.offerId,
                    <string>event.returnValues.creator,
                    <string>event.returnValues.externalId,
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    public static onOfferEnabled(callback: onOfferEnabledCallback): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onOfferEnabled" });

        const subscription = this.contract.events
            .OfferEnabled()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.providerAuth,
                    <string>event.returnValues.offerId,
                    <OfferType>event.returnValues.offerType,
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    public static onOfferDisabled(callback: onOfferDisbledCallback): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onOfferDisabled" });

        const subscription = this.contract.events
            .OfferEnabled()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.providerAuth,
                    <string>event.returnValues.offerId,
                    <OfferType>event.returnValues.offerType,
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }
}

// address -> offerId
export type onOfferCreatedCallback = (address: string, creator: string, externalId: string) => void;
export type onOfferEnabledCallback = (providerAuth: string, address: string, offerType: OfferType) => void;
export type onOfferDisbledCallback = (providerAuth: string, address: string, offerType: OfferType) => void;

export default OffersFactory;
