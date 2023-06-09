import rootLogger from "../logger";
import { checkIfActionAccountInitialized, objectToTuple } from "../utils";
import { BytesLike, formatBytes32String, parseBytes32String } from "ethers/lib/utils";
import { packDevicId } from "../utils";
import { BlockInfo, ContractEvent, TransactionOptions } from "../types/Web3";
import { TeeOfferInfo, TeeOfferInfoStructure } from "../types/TeeOfferInfo";
import { OfferType } from "../types/Offer";
import { OfferCreatedEvent, OptionAddedEvent, TeeSlotAddedEvent } from "../types/Events";
import { TeeOfferOption } from "../types/TeeOfferOption";
import BlockchainConnector from "../connectors/BlockchainConnector";
import Superpro from "./Superpro";
import TxManager from "../utils/TxManager";
import BlockchainEventsListener from "../connectors/BlockchainEventsListener";
import { HardwareInfo } from "../types/HardwareInfo";
import { StaticModel } from "./BaseStaticModel";

class TeeOffers extends StaticModel {
    private static cpuDenominator?: number;

    private static readonly logger = rootLogger.child({ className: "TeeOffers" });

    public static teeOffers?: string[];

    public static get address(): string {
        return Superpro.address;
    }

    public static async packHardwareInfo(hw: HardwareInfo): Promise<HardwareInfo> {
        hw.slotInfo.cpuCores *= await TeeOffers.getDenominator();

        return hw;
    }

    public static async unpackHardwareInfo(hw: HardwareInfo): Promise<HardwareInfo> {
        hw.slotInfo.cpuCores /= await TeeOffers.getDenominator();

        return hw;
    }

    public static async getDenominator(): Promise<number> {
        if (!this.cpuDenominator) {
            const contract = BlockchainConnector.getInstance().getContract();
            this.cpuDenominator = +(await contract.methods.getCpuDenominator().call());
        }

        return this.cpuDenominator;
    }
    /**
     * Function for fetching list of all TEE offers addresses
     */
    public static async getAll(): Promise<string[]> {
        const contract = BlockchainConnector.getInstance().getContract();

        const count = await contract.methods.getOffersTotalCount().call();
        this.teeOffers = this.teeOffers || [];
        const teeOfffersSet = new Set(this.teeOffers);

        for (let offerId = teeOfffersSet.size + 1; offerId <= count; ++offerId) {
            const offerType = (await contract.methods.getOfferType(offerId).call()) as OfferType;
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
    public static async create(
        providerAuthorityAccount: string,
        teeOfferInfo: TeeOfferInfo,
        externalId = "default",
        enabled = true,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        // Converts offer info to array of arrays (used in blockchain)
        teeOfferInfo.hardwareInfo = await TeeOffers.packHardwareInfo(teeOfferInfo.hardwareInfo);
        const teeOfferInfoParams = objectToTuple(teeOfferInfo, TeeOfferInfoStructure);
        const formattedExternalId = formatBytes32String(externalId);
        await TxManager.execute(
            contract.methods.createTeeOffer,
            [providerAuthorityAccount, teeOfferInfoParams, formattedExternalId, enabled],
            transactionOptions,
        );
    }

    public static async getByExternalId(creator: string, externalId: string): Promise<OfferCreatedEvent> {
        const contract = BlockchainConnector.getInstance().getContract();

        const filter = {
            creator,
            externalId: formatBytes32String(externalId),
        };
        const foundIds = await contract.getPastEvents("TeeOfferCreated", { filter });
        const notFound = {
            creator,
            externalId,
            offerId: "-1",
        };
        const response: OfferCreatedEvent =
            foundIds.length > 0 ? (foundIds[0].returnValues as OfferCreatedEvent) : notFound;

        return response;
    }

    /**
     * Function for fetching TEE offer id by TEE deviceId
     * @param deviceId - unque TEE device id (unparsed, from blockchain)
     * @returns TEE offer id
     */
    public static getByDeviceId(deviceId: string): Promise<string> {
        const contract = BlockchainConnector.getInstance().getContract();

        const fromattedDeviceId = packDevicId(deviceId);

        return contract.methods.getTeeOfferByDeviceId(fromattedDeviceId).call();
    }

    /**
     * Function for fetching total count of tee offer slots
     */
    public static async getSlotsCount(): Promise<number> {
        const contract = BlockchainConnector.getInstance().getContract();

        return +(await contract.methods.getTeeOffersSlotsCount().call());
    }

    /**
     * Function for fetching whether tee offer option exists or not
     * @param optionId - Option ID
     */
    public static async isOptionExists(optionId: string): Promise<boolean> {
        const contract = BlockchainConnector.getInstance().getContract();

        return await contract.methods.isOptionExists(optionId).call();
    }

    /**
     * Function for fetching total count of options
     */
    public static async getOptionsCount(): Promise<number> {
        const contract = BlockchainConnector.getInstance().getContract();

        return +(await contract.methods.getOptionsCount().call());
    }

    /**
     * Function for fetching tee offer option by id
     * @param optionId - Option ID
     */
    public static async getOptionById(optionId: string): Promise<TeeOfferOption> {
        const contract = BlockchainConnector.getInstance().getContract();

        return await contract.methods.getOptionById(optionId).call();
    }

    public static async getSlotByExternalId(
        filter: { creator: string; offerId: string; externalId: string },
        fromBlock?: number | string,
        toBlock?: number | string,
    ): Promise<TeeSlotAddedEvent | null> {
        filter.externalId = formatBytes32String(filter.externalId);

        const foundEvents = await this.getPastEvents("TeeSlotAdded", filter, fromBlock, toBlock);

        const response = foundEvents.length ? (foundEvents[0].returnValues as TeeSlotAddedEvent) : null;

        return response;
    }

    public static async getOptionByExternalId(
        filter: { creator: string; teeOfferId: string; externalId: string },
        fromBlock?: number | string,
        toBlock?: number | string,
    ): Promise<OptionAddedEvent | null> {
        filter.externalId = formatBytes32String(filter.externalId);

        const foundEvents = await this.getPastEvents("OptionAdded", filter, fromBlock, toBlock);

        const response = foundEvents.length ? (foundEvents[0].returnValues as OptionAddedEvent) : null;

        return response;
    }

    /**
     * Function for adding event listeners on onSlotAdded event in contract
     * @param creator - creator address
     * @param callback - function for processing created order
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onSlotAdded(callback: onTeeSlotAddedCallback, creator?: string): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onTeeSlotAdded" });

        const subscription = contract.events
            .TeeSlotAdded()
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
    public static onSlotUpdated(callback: onTeeSlotUpdatedCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onTeeSlotUpdated" });

        const subscription = contract.events
            .TeeSlotUpdated()
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
    public static onSlotDeleted(callback: onTeeSlotDeletedCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onTeeSlotDeleted" });

        const subscription = contract.events
            .TeeSlotDeleted()
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
     * Function for adding event listeners on OptionAdded event in contract
     * @param creator - creator address
     * @param callback - function for processing created order
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onOptionAdded(callback: onTeeOptionAddedCallback, creator?: string): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onTeeOptionAddedCallback" });

        const subscription = contract.events
            .OptionAdded()
            .on("data", async (event: ContractEvent) => {
                if (creator && event.returnValues.creator != creator) {
                    return;
                }
                callback(
                    <string>event.returnValues.creator,
                    <string>event.returnValues.teeOfferId,
                    <string>event.returnValues.optionId,
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
     * Function for adding event listeners on OptionUpdated event in contract
     * @param teeOfferId - tee offer id
     * @param callback - function for processing created order
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onOptionUpdated(callback: onTeeOptionUpdatedCallback, teeOfferId?: string): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onTeeOptionUpdatedCallback" });

        const subscription = contract.events
            .OptionUpdated()
            .on("data", async (event: ContractEvent) => {
                if (teeOfferId && event.returnValues.teeOfferId != teeOfferId) {
                    return;
                }
                callback(
                    <string>event.returnValues.teeOfferId,
                    <string>event.returnValues.optionId,
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
     * Function for adding event listeners on OptionDeleted event in contract
     * @param teeOfferId - tee offer id
     * @param callback - function for processing created order
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onOptionDeleted(callback: onTeeOptionDeletedCallback, teeOfferId?: string): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onTeeOptionDeletedCallback" });

        const subscription = contract.events
            .OptionDeleted()
            .on("data", async (event: ContractEvent) => {
                if (teeOfferId && event.returnValues.teeOfferId != teeOfferId) {
                    return;
                }
                callback(
                    <string>event.returnValues.teeOfferId,
                    <string>event.returnValues.optionId,
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
     * Function for adding event listeners on TEE offer created event in TEE offers factory contract
     * @param callback - function for processing created TEE offer
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onCreated(callback: onTeeOfferCreatedCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onTeeOfferCreated" });

        const subscription = contract.events
            .TeeOfferCreated()
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

    public static onViolationRateChanged(callback: onTeeViolationRateChangedCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onTeeOfferViolationRateChanged" });

        const subscription = contract.events
            .TeeOfferViolationRateChanged()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.offerId,
                    <string>event.returnValues.providerAuth,
                    <number>event.returnValues.violationRate,
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

export type onTeeOfferCreatedCallback = (
    offerId: string,
    creator: string,
    externalId: string,
    block?: BlockInfo,
) => void;
export type onTeeViolationRateChangedCallback = (
    offerId: string,
    providerAuth: string,
    violationRate: number,
    block?: BlockInfo,
) => void;
export type onTeeOptionAddedCallback = (
    creator: string,
    teeOfferId: string,
    optionId: string,
    externalId: string,
    block?: BlockInfo,
) => void;
export type onTeeOptionUpdatedCallback = (teeOfferId: string, optionId: string, block?: BlockInfo) => void;
export type onTeeOptionDeletedCallback = (teeOfferId: string, optionId: string, block?: BlockInfo) => void;
export type onTeeSlotAddedCallback = (
    creator: string,
    offerId: string,
    slotId: string,
    externalId: string,
    block?: BlockInfo,
) => void;
export type onTeeSlotUpdatedCallback = (offerId: string, slotId: string, block?: BlockInfo) => void;
export type onTeeSlotDeletedCallback = (offerId: string, slotId: string, block?: BlockInfo) => void;

export default TeeOffers;
