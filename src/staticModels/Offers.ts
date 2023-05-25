import rootLogger from "../logger";
import { checkIfActionAccountInitialized, objectToTuple } from "../utils";
import { OfferInfo, OfferInfoStructure, OfferType } from "../types/Offer";
import { BytesLike, formatBytes32String, parseBytes32String } from "ethers/lib/utils";
import { BlockInfo, ContractEvent, TransactionOptions } from "../types/Web3";
import { OfferCreatedEvent, ValueSlotAddedEvent } from "../types/Events";
import Superpro from "./Superpro";
import TxManager from "../utils/TxManager";
import BlockchainConnector from "../connectors/BlockchainConnector";
import BlockchainEventsListener from "../connectors/BlockchainEventsListener";
import { StaticModel } from "./BaseStaticModel";

class Offers extends StaticModel {
    private static readonly logger = rootLogger.child({ className: "Offers" });

    public static offers?: string[];

    public static get address(): string {
        return Superpro.address;
    }

    /**
     * Function for fetching list of all offers ids
     */
    public static async getAll(): Promise<string[]> {
        const contract = BlockchainConnector.getInstance().getContract();

        const count = await contract.methods.getOffersTotalCount().call();
        this.offers = this.offers || [];
        const offersSet = new Set(this.offers);

        for (let offerId = offersSet.size + 1; offerId <= count; ++offerId) {
            const offerType = (await contract.methods.getOfferType(offerId).call()) as OfferType;
            if (offerType !== OfferType.TeeOffer) {
                offersSet.add(offerId.toString());
            }
        }
        this.offers = Array.from(offersSet);

        return this.offers;
    }

    /**
     * Function for fetching total count of value offer slots
     */
    public static async getSlotsCount(): Promise<number> {
        const contract = BlockchainConnector.getInstance().getContract();

        return +(await contract.methods.getValueOffersSlotsCount().call());
    }

    /**
     * Creates new offer
     * @param providerAuthorityAccount - address of authority account of provider
     * @param offerInfo - data of new offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async create(
        providerAuthorityAccount: string,
        offerInfo: OfferInfo,
        externalId = "default",
        enabled = true,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        const offerInfoParams = objectToTuple(offerInfo, OfferInfoStructure);
        const formattedExternalId = formatBytes32String(externalId);
        await TxManager.execute(
            contract.methods.createValueOffer,
            [providerAuthorityAccount, offerInfoParams, formattedExternalId, enabled],
            transactionOptions,
        );
    }

    public static async getByExternalId(creator: string, externalId: string): Promise<OfferCreatedEvent> {
        const contract = BlockchainConnector.getInstance().getContract();
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
                      offerId: "-1",
                  };

        return response;
    }

    public static async getSlotByExternalId(
        filter: { creator: string; offerId: string; externalId: string },
        fromBlock?: number | string,
        toBlock?: number | string,
    ): Promise<ValueSlotAddedEvent> {
        filter.externalId = formatBytes32String(filter.externalId);

        const foundEvents = await this.getPastEvents("ValueSlotAdded", filter, fromBlock, toBlock);
        const response =
            foundEvents.length > 0
                ? (foundEvents[0].returnValues as ValueSlotAddedEvent)
                : {
                      ...filter,
                      slotId: "-1",
                  };
        response.externalId = parseBytes32String(response.externalId);

        return response;
    }

    /**
     * Function for adding event listeners on onSlotAdded event in contract
     * @param creator - creator address
     * @param callback - function for processing created order
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onSlotAdded(callback: onSlotAddedCallback, creator?: string): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onValueSlotAdded" });

        const subscription = contract.events
            .ValueSlotAdded()
            .on("data", async (event: ContractEvent) => {
                if (creator && event.returnValues.creator != creator) {
                    return;
                }
                callback(
                    <string>event.returnValues.creator,
                    <string>event.returnValues.offerId,
                    <string>event.returnValues.slotId,
                    parseBytes32String(<BytesLike>event.returnValues.externalId),
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return;
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for adding event listeners on onSlotUpdated event in contract
     * @param callback - function for processing created order
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onSlotUpdated(callback: onSlotUpdatedCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onValueSlotUpdated" });

        const subscription = contract.events
            .ValueSlotUpdated()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.offerId,
                    <string>event.returnValues.slotId,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return;
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for adding event listeners on onSlotDeleted event in contract
     * @param callback - function for processing created order
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onSlotDeleted(callback: onSlotDeletedCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onValueSlotDeleted" });

        const subscription = contract.events
            .ValueSlotDeleted()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.offerId,
                    <string>event.returnValues.slotId,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return;
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for adding event listeners on offer created event in offers factory contract
     * @param callback - function for processing created offer
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onCreated(callback: onOfferCreatedCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onOfferCreated" });

        const subscription = contract.events
            .OfferCreated()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.offerId,
                    <string>event.returnValues.creator,
                    parseBytes32String(<BytesLike>event.returnValues.externalId),
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    public static onEnabled(callback: onOfferEnabledCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onOfferEnabled" });

        const subscription = contract.events
            .OfferEnabled()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.providerAuth,
                    <string>event.returnValues.offerId,
                    <OfferType>event.returnValues.offerType,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    public static onDisabled(callback: onOfferDisbledCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onOfferDisabled" });

        const subscription = contract.events
            .OfferDisabled()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.providerAuth,
                    <string>event.returnValues.offerId,
                    <OfferType>event.returnValues.offerType,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
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
export type onOfferCreatedCallback = (id: string, creator: string, externalId: string, block?: BlockInfo) => void;
export type onOfferEnabledCallback = (
    providerAuth: string,
    id: string,
    offerType: OfferType,
    block?: BlockInfo,
) => void;
export type onOfferDisbledCallback = (
    providerAuth: string,
    id: string,
    offerType: OfferType,
    block?: BlockInfo,
) => void;
export type onSlotAddedCallback = (
    creator: string,
    offerId: string,
    slotId: string,
    externalId: string,
    block?: BlockInfo,
) => void;
export type onSlotUpdatedCallback = (offerId: string, slotId: string, block?: BlockInfo) => void;
export type onSlotDeletedCallback = (offerId: string, slotId: string, block?: BlockInfo) => void;

export default Offers;
