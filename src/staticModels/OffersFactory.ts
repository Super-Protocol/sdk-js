import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import appJSON from "../contracts/app.json";
import { checkIfActionAccountInitialized, checkIfInitialized, objectToTuple } from "../utils";
import { OfferInfo, OfferInfoV1, OfferInfoStructure, OfferType } from "../types/Offer";
import { formatBytes32String } from "ethers/lib/utils";
import { BlockInfo, ContractEvent, TransactionOptions } from "../types/Web3";
import { OfferCreatedEvent } from "../types/Events";
import Superpro from "./Superpro";
import TxManager from "../utils/TxManager";
import BlockchainConnector from "../BlockchainConnector";

class OffersFactory {
    private static logger: typeof rootLogger;

    public static offers?: string[];

    public static get address(): string {
        return Superpro.address;
    }

    /**
     * Function for fetching list of all offers ids
     */
    public static async getAllOffers(): Promise<string[]> {
        const contract = BlockchainConnector.getContractInstance();

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
        const contract = BlockchainConnector.getContractInstance(transactionOptions);
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
        const contract = BlockchainConnector.getContractInstance();
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
        const contract = BlockchainConnector.getContractInstance();
        const logger = this.logger.child({ method: "onOfferCreated" });

        const subscription = contract.events
            .OfferCreated()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.offerId,
                    <string>event.returnValues.creator,
                    <string>event.returnValues.externalId,
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

    public static onOfferEnabled(callback: onOfferEnabledCallback): () => void {
        const contract = BlockchainConnector.getContractInstance();
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

    public static onOfferDisabled(callback: onOfferDisbledCallback): () => void {
        const contract = BlockchainConnector.getContractInstance();
        const logger = this.logger.child({ method: "onOfferDisabled" });

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

export default OffersFactory;
