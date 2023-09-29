import rootLogger from '../logger';
import { checkIfActionAccountInitialized } from '../utils/helper';
import { OfferInfo, OfferType } from '../types/Offer';
import { BytesLike, formatBytes32String, parseBytes32String } from 'ethers/lib/utils';
import { BlockInfo, TransactionOptions } from '../types/Web3';
import { OfferCreatedEvent, ValueSlotAddedEvent } from '../types/Events';
import Superpro from './Superpro';
import TxManager from '../utils/TxManager';
import BlockchainConnector from '../connectors/BlockchainConnector';
import BlockchainEventsListener from '../connectors/BlockchainEventsListener';
import { EventLog } from 'web3-eth-contract';

class Offers {
    private static readonly logger = rootLogger.child({ className: 'Offers' });

    public static offers?: string[];

    public static get address(): string {
        return Superpro.address;
    }

    /**
     * Function for fetching list of all offers ids
     */
    public static async getAll(): Promise<string[]> {
        const contract = BlockchainConnector.getInstance().getContract();

        const count = Number(await contract.methods.getOffersTotalCount().call());
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
        externalId = 'default',
        enabled = true,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract();
        checkIfActionAccountInitialized(transactionOptions);

        const formattedExternalId = formatBytes32String(externalId);
        await TxManager.execute(
            contract.methods.createValueOffer(providerAuthorityAccount, offerInfo, formattedExternalId, enabled),
            transactionOptions,
        );
    }

    public static async getByExternalId(
        creator: string,
        externalId: string,
        fromBlock?: number | string,
        toBlock?: number | string,
    ): Promise<OfferCreatedEvent> {
        const contract = BlockchainConnector.getInstance().getContract();
        const filter = {
            creator,
            externalId: formatBytes32String(externalId),
        };
        const options: any = { filter };

        if (fromBlock) options.fromBlock = fromBlock;
        if (toBlock) options.toBlock = toBlock;

        const foundIds: (string | EventLog)[] = await contract.getPastEvents(
            'OfferCreated',
            options,
        );
        const response: OfferCreatedEvent =
            foundIds.length > 0
                ? ((foundIds[0] as EventLog).returnValues as OfferCreatedEvent)
                : {
                      creator,
                      externalId,
                      offerId: '-1',
                  };

        return response;
    }

    public static async getSlotByExternalId(filter: {
        creator: string;
        offerId: string;
        externalId: string;
        fromBlock?: number | string;
        toBlock?: number | string;
    }): Promise<ValueSlotAddedEvent | null> {
        const contract = BlockchainConnector.getInstance().getContract();
        filter.externalId = formatBytes32String(filter.externalId);

        const foundEvents = await contract.getPastEvents('ValueSlotAdded', filter);

        const response = foundEvents.length
            ? ((foundEvents[0] as EventLog).returnValues as ValueSlotAddedEvent)
            : null;

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
        const logger = this.logger.child({ method: 'onValueSlotAdded' });

        const subscription = contract.events.ValueSlotAdded();
        subscription.on('data', (event: EventLog): void => {
            if (creator && event.returnValues.creator != creator) {
                return;
            }
            callback(
                <string>event.returnValues.creator,
                <bigint>event.returnValues.offerId,
                <bigint>event.returnValues.slotId,
                parseBytes32String(<BytesLike>event.returnValues.externalId),
                <BlockInfo>{
                    index: <number>event.blockNumber,
                    hash: <string>event.blockHash,
                },
            );
        });
        subscription.on('error', (error: Error) => {
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
        const logger = this.logger.child({ method: 'onValueSlotUpdated' });

        const subscription = contract.events.ValueSlotUpdated();
        subscription.on('data', (event: EventLog): void => {
            callback(
                <bigint>event.returnValues.offerId,
                <bigint>event.returnValues.slotId,
                <BlockInfo>{
                    index: <number>event.blockNumber,
                    hash: <string>event.blockHash,
                },
            );
        });
        subscription.on('error', (error: Error): void => {
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
        const logger = this.logger.child({ method: 'onValueSlotDeleted' });

        const subscription = contract.events.ValueSlotDeleted();
        subscription.on('data', (event: EventLog): void => {
            callback(
                <bigint>event.returnValues.offerId,
                <bigint>event.returnValues.slotId,
                <BlockInfo>{
                    index: <number>event.blockNumber,
                    hash: <string>event.blockHash,
                },
            );
        });
        subscription.on('error', (error: Error) => {
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
        const logger = this.logger.child({ method: 'onOfferCreated' });

        const subscription = contract.events.OfferCreated();
        subscription.on('data', (event: EventLog): void => {
            callback(
                <bigint>event.returnValues.offerId,
                <string>event.returnValues.creator,
                parseBytes32String(<BytesLike>event.returnValues.externalId),
                <BlockInfo>{
                    index: <number>event.blockNumber,
                    hash: <string>event.blockHash,
                },
            );
        });
        subscription.on('error', (error: Error) => {
            logger.warn(error);
        });

        return () => subscription.unsubscribe();
    }

    public static onEnabled(callback: onOfferEnabledCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: 'onOfferEnabled' });

        const subscription = contract.events.OfferEnabled();
        subscription.on('data', (event: EventLog): void => {
            callback(
                <string>event.returnValues.providerAuth,
                <bigint>event.returnValues.offerId,
                <OfferType>event.returnValues.offerType,
                <BlockInfo>{
                    index: <number>event.blockNumber,
                    hash: <string>event.blockHash,
                },
            );
        });
        subscription.on('error', (error: Error) => {
            logger.warn(error);
        });

        return () => subscription.unsubscribe();
    }

    public static onDisabled(callback: onOfferDisbledCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: 'onOfferDisabled' });

        const subscription = contract.events.OfferDisabled();
        subscription.on('data', (event: EventLog): void => {
            callback(
                <string>event.returnValues.providerAuth,
                <bigint>event.returnValues.offerId,
                <OfferType>event.returnValues.offerType,
                <BlockInfo>{
                    index: <number>event.blockNumber,
                    hash: <string>event.blockHash,
                },
            );
        });
        subscription.on('error', (error: Error): void => {
            logger.warn(error);
        });

        return () => subscription.unsubscribe();
    }
}

// address -> offerId
export type onOfferCreatedCallback = (
    id: bigint,
    creator: string,
    externalId: string,
    block?: BlockInfo,
) => void;
export type onOfferEnabledCallback = (
    providerAuth: string,
    id: bigint,
    offerType: OfferType,
    block?: BlockInfo,
) => void;
export type onOfferDisbledCallback = (
    providerAuth: string,
    id: bigint,
    offerType: OfferType,
    block?: BlockInfo,
) => void;
export type onSlotAddedCallback = (
    creator: string,
    offerId: bigint,
    slotId: bigint,
    externalId: string,
    block?: BlockInfo,
) => void;
export type onSlotUpdatedCallback = (offerId: bigint, slotId: bigint, block?: BlockInfo) => void;
export type onSlotDeletedCallback = (offerId: bigint, slotId: bigint, block?: BlockInfo) => void;

export default Offers;
