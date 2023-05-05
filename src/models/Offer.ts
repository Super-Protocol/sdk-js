import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import appJSON from "../contracts/app.json";
import {
    checkIfActionAccountInitialized,
    tupleToObject,
    objectToTuple,
    incrementMethodCall,
    tupleToObjectsArray,
    unpackSlotInfo,
    packSlotInfo,
} from "../utils";
import { OfferInfo, OfferInfoStructure, OfferType } from "../types/Offer";
import { TransactionOptions } from "../types/Web3";
import { Origins, OriginsStructure } from "../types/Origins";
import BlockchainConnector from "../connectors/BlockchainConnector";
import Superpro from "../staticModels/Superpro";
import TxManager from "../utils/TxManager";
import { ValueOfferSlot, ValueOfferSlotStructure } from "../types/ValueOfferSlot";
import { SlotInfo, SlotInfoStructure } from "../types/SlotInfo";
import { OptionInfo, OptionInfoStructure } from "../types/OptionInfo";
import { SlotUsage, SlotUsageStructure } from "../types/SlotUsage";
import { formatBytes32String } from "ethers/lib/utils";

class Offer {
    private static contract: Contract;
    private logger: typeof rootLogger;

    public offerInfo?: OfferInfo;
    public provider?: string;
    public type?: OfferType;
    public providerAuthority?: string;
    public origins?: Origins;
    public id: string;
    public enabled?: boolean;
    public closingPrice?: string;
    public minDeposit?: string;

    constructor(offerId: string) {
        this.id = offerId;
        if (!Offer.contract) {
            Offer.contract = BlockchainConnector.getInstance().getContract();
        }
        this.logger = rootLogger.child({
            className: "Offer",
            offerId: this.id,
        });
    }

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private checkInitOffer(transactionOptions: TransactionOptions) {
        if (transactionOptions?.web3) {
            return new transactionOptions.web3.eth.Contract(<AbiItem[]>appJSON.abi, Superpro.address);
        }
    }

    /**
     * Function for fetching offer status from blockchain
     */
    @incrementMethodCall()
    public async isEnabled(): Promise<boolean> {
        return await Offer.contract.methods.isOfferEnabled(this.id).call();
    }

    /**
     * Updates name in offer info
     * @param name - new name
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async setName(name: string, transactionOptions?: TransactionOptions): Promise<void> {
        transactionOptions ?? this.checkInitOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(Offer.contract.methods.setOfferName, [this.id, name], transactionOptions);
        if (this.offerInfo) this.offerInfo.name = name;
    }

    /**
     * Updates description in offer info
     * @param description - new description
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async setDescription(description: string, transactionOptions?: TransactionOptions): Promise<void> {
        transactionOptions ?? this.checkInitOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(Offer.contract.methods.setOfferDescription, [this.id, description], transactionOptions);
        if (this.offerInfo) this.offerInfo.description = description;
    }

    /**
     * Updates offer info
     * @param newInfo - new offer info
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async setInfo(newInfo: OfferInfo, transactionOptions?: TransactionOptions): Promise<void> {
        transactionOptions ?? this.checkInitOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        const newInfoTuple = objectToTuple(newInfo, OfferInfoStructure);
        await TxManager.execute(Offer.contract.methods.setValueOfferInfo, [this.id, newInfoTuple], transactionOptions);
        if (this.offerInfo) this.offerInfo = newInfo;
    }

    /**
     * Function for fetching offer info from blockchain
     */
    @incrementMethodCall()
    public async getInfo(): Promise<OfferInfo> {
        const [, , offerInfoParams] = await Offer.contract.methods.getValueOffer(this.id).call();

        this.offerInfo = tupleToObject(offerInfoParams, OfferInfoStructure);

        return this.offerInfo;
    }

    /**
     * Function for fetching offer provider from blockchain (works for TEE and Value offers)
     */
    @incrementMethodCall()
    public async getProvider(): Promise<string> {
        this.provider = await Offer.contract.methods.getOfferProviderAuthority(this.id).call();

        return this.provider!;
    }

    /**
     * Fetch offer type from blockchain (works for TEE and Value offers)
     */
    @incrementMethodCall()
    public async getOfferType(): Promise<OfferType> {
        this.type = await Offer.contract.methods.getOfferType(this.id).call();

        return this.type!;
    }

    /**
     * Function for fetching TEE offer provider authority account from blockchain
     */
    @incrementMethodCall()
    public async getProviderAuthority(): Promise<string> {
        this.providerAuthority = await Offer.contract.methods.getOfferProviderAuthority(this.id).call();

        return this.providerAuthority!;
    }

    /**
     * Fetch new Origins (createdDate, createdBy, modifiedDate and modifiedBy)
     */
    @incrementMethodCall()
    public async getOrigins(): Promise<Origins> {
        let origins = await Offer.contract.methods.getOfferOrigins(this.id).call();

        // Converts blockchain array into object
        origins = tupleToObject(origins, OriginsStructure);

        // Convert blockchain time seconds to js time milliseconds
        origins.createdDate = +origins.createdDate * 1000;
        origins.modifiedDate = +origins.modifiedDate * 1000;

        return (this.origins = origins);
    }

    /**
     * Function for fetching offer hold deposit
     */
    @incrementMethodCall()
    public async getMinDeposit(
        slotId: number,
        slotCount: number,
        optionsIds: number[],
        optionsCount: number[],
    ): Promise<string> {
        this.minDeposit = await Offer.contract.methods
            .getOfferMinDeposit(this.id, slotId, slotCount, optionsIds, optionsCount)
            .call();

        return this.minDeposit!;
    }

    /**
     * Function for fetching cheapest value offer from blockchain
     */
    @incrementMethodCall()
    public async getCheapestPrice(): Promise<string> {
        return await Offer.contract.methods.getCheapestValueOffersPrice(this.id).call();
    }

    @incrementMethodCall()
    public async isOfferExists(): Promise<boolean> {
        return await Offer.contract.methods.isOfferExists(this.id).call();
    }

    /**
     * Function for fetching whether offer slot exists or not
     * @param slotId - Slot ID
     */
    public async isSlotExists(slotId: string): Promise<boolean> {
        return await Offer.contract.methods.isValueOfferSlotExists(this.id, slotId).call();
    }

    /**
     * Function for fetching offer slot by id
     * @param slotId - Slot ID
     */
    public async getSlotById(slotId: string): Promise<ValueOfferSlot> {
        let slot = await Offer.contract.methods.getValueOfferSlotById(this.id, slotId).call();
        slot.info = unpackSlotInfo(slot.info, +(await Offer.contract.methods.getCpuDenominator().call()));

        return tupleToObject(slot, ValueOfferSlotStructure);
    }

    /**
     * Function for fetching  offer slots info from blockchain
     * @param begin - The first element of range.
     * @param end - One past the final element in the range.
     * @returns {Promise<ValueOfferSlot[]>}
     */
    public async getSlots(begin: number, end: number): Promise<ValueOfferSlot[]> {
        let slots = await Offer.contract.methods.getValueOfferSlots(this.id, begin, end).call();
        for (let slot of slots) {
            slot.info = unpackSlotInfo(slot.info, +(await Offer.contract.methods.getCpuDenominator().call()));
        }

        return tupleToObjectsArray(slots, ValueOfferSlotStructure);
    }

    /**
     * Function for add slot usage to the value offer
     * @param slotInfo - slot info
     * @param optionInfo - option info
     * @param slotUsage - slot usage info
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    @incrementMethodCall()
    public async addSlot(
        slotInfo: SlotInfo,
        optionInfo: OptionInfo,
        slotUsage: SlotUsage,
        externalId = "default",
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        slotInfo = packSlotInfo(slotInfo, +(await Offer.contract.methods.getCpuDenominator().call()));
        const slotInfoTuple = objectToTuple(slotInfo, SlotInfoStructure);
        const optionInfoTuple = objectToTuple(optionInfo, OptionInfoStructure);
        const slotUsageTuple = objectToTuple(slotUsage, SlotUsageStructure);
        const formattedExternalId = formatBytes32String(externalId);
        await TxManager.execute(
            contract.methods.addValueOfferSlot,
            [this.id, formattedExternalId, slotInfoTuple, optionInfoTuple, slotUsageTuple],
            transactionOptions,
        );
    }

    /**
     * Function for update slot usage of value offer
     * @param slotInfo - new slot info
     * @param optionInfo - new option info
     * @param slotUsage - new slot usage info
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    @incrementMethodCall()
    public async updateSlot(
        slotId: string,
        newSlotInfo: SlotInfo,
        newOptionInfo: OptionInfo,
        newUsage: SlotUsage,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        newSlotInfo = packSlotInfo(newSlotInfo, +(await Offer.contract.methods.getCpuDenominator().call()));
        const newSlotInfoTuple = objectToTuple(newSlotInfo, SlotInfoStructure);
        const newOptionInfoTuple = objectToTuple(newOptionInfo, OptionInfoStructure);
        const newSlotUsageTuple = objectToTuple(newUsage, SlotUsageStructure);
        await TxManager.execute(
            contract.methods.updateValueOfferSlot,
            [this.id, slotId, newSlotInfoTuple, newOptionInfoTuple, newSlotUsageTuple],
            transactionOptions,
        );
    }

    /**
     * Function for delete slot usage from offer
     * @param slotId - Slot ID
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    @incrementMethodCall()
    public async deleteSlot(slotId: string, transactionOptions?: TransactionOptions): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(contract.methods.deleteValueOfferSlot, [this.id, slotId], transactionOptions);
    }

    /**
     * Function for disabling offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async disable(transactionOptions?: TransactionOptions) {
        transactionOptions ?? this.checkInitOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(Offer.contract.methods.disableOffer, [this.id], transactionOptions);
    }

    /**
     * Function for enabling offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async enable(transactionOptions?: TransactionOptions) {
        transactionOptions ?? this.checkInitOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(Offer.contract.methods.enableOffer, [this.id], transactionOptions);
    }

    /**
     * Checks if passed offer match restrictions in this offer
     * @param offerId - id of offer what needs to be checked
     */
    @incrementMethodCall()
    public async isRestrictionsPermitThatOffer(offerId: string) {
        return await Offer.contract.methods.isOfferRestrictionsPermitOtherOffer(this.id, offerId).call();
    }

    /**
     * Checks if this offer contains restrictions of a certain type
     * @param type - type of offer which needs to be checked
     */
    @incrementMethodCall()
    public async isRestrictedByOfferType(type: OfferType) {
        return await Offer.contract.methods.isOfferRestrictedByOfferType(this.id, type).call();
    }
}

export default Offer;
