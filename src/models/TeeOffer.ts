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
import { TeeOfferInfo, TeeOfferInfoStructure } from "../types/TeeOfferInfo";
import { TransactionOptions } from "../types/Web3";
import { OfferType } from "../types/Offer";
import { Origins, OriginsStructure } from "../types/Origins";
import Superpro from "../staticModels/Superpro";
import BlockchainConnector from "../connectors/BlockchainConnector";
import TxManager from "../utils/TxManager";
import { HardwareInfo, HardwareInfoStructure } from "../types/HardwareInfo";
import { TeeOfferOption, TeeOfferOptionStructure } from "../types/TeeOfferOption";
import { TeeOfferSlot, TeeOfferSlotStructure } from "../types/TeeOfferSlot";
import { OptionInfo, OptionInfoStructure } from "../types/OptionInfo";
import { SlotUsage, SlotUsageStructure } from "../types/SlotUsage";
import { formatBytes32String } from "ethers/lib/utils";
import { SlotInfo, SlotInfoStructure } from "../types/SlotInfo";
import TeeOffers from "../staticModels/TeeOffers";

class TeeOffer {
    private static contract: Contract;
    private logger: typeof rootLogger;

    public id: string;

    public violationRate?: number;
    public totalLocked?: number;
    public offerInfo?: TeeOfferInfo;

    public type?: OfferType;
    public providerAuthority?: string;
    public provider?: string;
    public enabled?: boolean;
    public tcb?: string;
    public closingPrice?: string;
    public tlbAddedTime?: number;
    public tcbAddedTime?: number;
    public origins?: Origins;
    public isCancelable?: boolean;
    public cpuDenominator?: number;
    public minDeposit?: string;

    constructor(offerId: string) {
        this.id = offerId;
        if (!TeeOffer.contract) {
            TeeOffer.contract = BlockchainConnector.getInstance().getContract();
        }

        this.logger = rootLogger.child({ className: "TeeOffer" });
    }

    /**
     * Function for fetching offer status from the blockchain
     */
    @incrementMethodCall()
    public async isEnabled(): Promise<boolean> {
        return TeeOffer.contract.methods.isOfferEnabled(this.id).call();
    }

    /**
     * Function for fetching offer hold deposit
     */
    @incrementMethodCall()
    public async getMinDeposit(
        slotId: string,
        slotCount: string,
        optionsIds: string[],
        optionsCount: string[],
    ): Promise<string> {
        this.minDeposit = await TeeOffer.contract.methods
            .getOfferMinDeposit(this.id, slotId, slotCount, optionsIds, optionsCount)
            .call();

        return this.minDeposit!;
    }

    /**
     * @returns this TEE offer slots count
     */
    public async getSlotsCount(): Promise<string> {
        return await TeeOffer.contract.methods.getTeeOfferSlotsCount().call();
    }

    /**
     * @returns True if offer is cancelable.
     */
    @incrementMethodCall()
    public async isOfferCancelable(): Promise<boolean> {
        this.isCancelable = await TeeOffer.contract.methods.isOfferCancelable(this.id).call();

        return this.isCancelable!;
    }

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    @incrementMethodCall()
    private checkInitTeeOffer(transactionOptions: TransactionOptions) {
        if (transactionOptions?.web3) {
            return new transactionOptions.web3.eth.Contract(<AbiItem[]>appJSON.abi, Superpro.address);
        }
    }

    /**
     * Function for fetching TEE offer info from blockchain
     */
    @incrementMethodCall()
    public async getInfo(): Promise<TeeOfferInfo> {
        const [, , teeOfferInfoParams] = await TeeOffer.contract.methods.getTeeOffer(this.id).call();

        this.offerInfo = tupleToObject(teeOfferInfoParams, TeeOfferInfoStructure);
        this.offerInfo.hardwareInfo = await TeeOffers.unpackHardwareInfo(this.offerInfo.hardwareInfo);

        return this.offerInfo;
    }

    /**
     * Function for fetching TEE offer hardware info from blockchain
     */
    @incrementMethodCall()
    public async getHardwareInfo(): Promise<HardwareInfo> {
        let hardwareInfo = await TeeOffer.contract.methods.getTeeOfferHardwareInfo(this.id).call();
        hardwareInfo = tupleToObject(hardwareInfo, HardwareInfoStructure);

        return await TeeOffers.unpackHardwareInfo(hardwareInfo);
    }

    /**
     * Function for fetching TEE offer options info from blockchain
     * @param begin - The first element of range.
     * @param end - One past the final element in the range.
     * @returns {Promise<TeeOfferOption[]>}
     */
    public async getOptions(begin = 0, end = 999999): Promise<TeeOfferOption[]> {
        const teeOfferOption = await TeeOffer.contract.methods.getTeeOfferOptions(this.id, begin, end).call();

        return tupleToObjectsArray(teeOfferOption, TeeOfferOptionStructure);
    }

    /**
     * Function for fetching tee offer slot by id
     * @param optionId - Slot ID
     */
    public async getOptionById(optionId: string): Promise<TeeOfferOption> {
        const teeOfferOption = await TeeOffer.contract.methods.getOptionById(optionId).call();

        return tupleToObject(teeOfferOption, TeeOfferOptionStructure);
    }

    /**
     * Function for fetching whether tee offer slot exists or not
     * @param optionId - Option ID
     */
    public async isOptionExists(optionId: string): Promise<boolean> {
        return await TeeOffer.contract.methods.isTeeOfferSlotExists(this.id, optionId).call();
    }

    /**
     * Function for add option usage to the tee offer
     * @param optionId - Option ID
     * @param info - New option info
     * @param usage - New slot usage info
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    @incrementMethodCall()
    public async addOption(
        info: OptionInfo,
        usage: SlotUsage,
        externalId = "default",
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        const newInfoTuple = objectToTuple(info, OptionInfoStructure);
        const newUsageTuple = objectToTuple(usage, SlotUsageStructure);
        const formattedExternalId = formatBytes32String(externalId);
        await TxManager.execute(
            contract.methods.addOption,
            [this.id, formattedExternalId, newInfoTuple, newUsageTuple],
            transactionOptions,
        );
    }

    /**
     * Function for update option info and usage
     * @param optionId - Option ID
     * @param newInfo - New option info
     * @param newUsage - New slot usage info
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    @incrementMethodCall()
    public async updateOption(
        optionId: string,
        newInfo: OptionInfo,
        newUsage: SlotUsage,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        const newInfoTuple = objectToTuple(newInfo, OptionInfoStructure);
        const newUsageTuple = objectToTuple(newUsage, SlotUsageStructure);
        await TxManager.execute(
            contract.methods.updateOption,
            [this.id, optionId, newInfoTuple, newUsageTuple],
            transactionOptions,
        );
    }

    /**
     * Function for delete option
     * @param optionId - Option ID
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    @incrementMethodCall()
    public async deleteOption(optionId: string, transactionOptions?: TransactionOptions): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(contract.methods.deleteOption, [this.id, optionId], transactionOptions);
    }

    /**
     * Function for fetching whether tee offer slot exists or not
     * @param slotId - Slot ID
     */
    public async isSlotExists(slotId: string): Promise<boolean> {
        return await TeeOffer.contract.methods.isTeeOfferSlotExists(this.id, slotId).call();
    }

    /**
     * Function for fetching tee offer slot by id
     * @param slotId - Slot ID
     */
    public async getSlotById(slotId: string): Promise<TeeOfferSlot> {
        let slot = await TeeOffer.contract.methods.getTeeOfferSlotById(this.id, slotId).call();
        slot = tupleToObject(slot, TeeOfferSlotStructure);
        slot.info = unpackSlotInfo(slot.info, await TeeOffers.getDenominator());

        return slot;
    }

    /**
     * Function for fetching TEE offer slots info from blockchain
     * @param begin - The first element of range.
     * @param end - One past the final element in the range.
     * @returns {Promise<TeeOfferSlot[]>}
     */
    public async getSlots(begin = 0, end = 999999): Promise<TeeOfferSlot[]> {
        let slots = await TeeOffer.contract.methods.getTeeOfferSlots(this.id, begin, end).call();
        slots = tupleToObjectsArray(slots, TeeOfferSlotStructure);
        for (let slot of slots) {
            slot.info = unpackSlotInfo(slot.info, await TeeOffers.getDenominator());
        }

        return slots;
    }

    /**
     * Function for add slot usage to the tee offer
     * @param info - New option info
     * @param usage - New slot usage info
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    @incrementMethodCall()
    public async addSlot(
        info: SlotInfo,
        usage: SlotUsage,
        externalId = "default",
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        info = packSlotInfo(info, await TeeOffers.getDenominator());
        const infoTuple = objectToTuple(info, SlotInfoStructure);
        const usageTuple = objectToTuple(usage, SlotUsageStructure);
        const formattedExternalId = formatBytes32String(externalId);
        await TxManager.execute(
            contract.methods.addTeeOfferSlot,
            [this.id, formattedExternalId, infoTuple, usageTuple],
            transactionOptions,
        );
    }

    /**
     * Function for update slot usage to the tee offer
     * @param slotId - Slot ID
     * @param newInfo - New slot info
     * @param newUsage - New slot usage info
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    @incrementMethodCall()
    public async updateSlot(
        slotId: string,
        newInfo: SlotInfo,
        newUsage: SlotUsage,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        newInfo = packSlotInfo(newInfo, await TeeOffers.getDenominator());
        const newInfoTuple = objectToTuple(newInfo, SlotInfoStructure);
        const newUsageTuple = objectToTuple(newUsage, SlotUsageStructure);
        await TxManager.execute(
            contract.methods.updateTeeOfferSlot,
            [this.id, slotId, newInfoTuple, newUsageTuple],
            transactionOptions,
        );
    }

    /**
     * Function for delete slot usage to the tee offer
     * @param slotId - Slot ID
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    @incrementMethodCall()
    public async deleteSlot(slotId: string, transactionOptions?: TransactionOptions): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(contract.methods.deleteTeeOfferSlot, [this.id, slotId], transactionOptions);
    }

    /**
     * Function for fetching TEE offer provider authority account from blockchain
     */
    @incrementMethodCall()
    public async getProviderAuthority(): Promise<string> {
        this.providerAuthority = await TeeOffer.contract.methods.getOfferProviderAuthority(this.id).call();

        return this.providerAuthority!;
    }

    /**
     * Fetch offer type from blockchain (works for TEE and Value offers)
     */
    @incrementMethodCall()
    public async getOfferType(): Promise<OfferType> {
        this.type = await TeeOffer.contract.methods.getOfferType(this.id).call();

        return this.type!;
    }

    @incrementMethodCall()
    public async isTeeOfferVerifying(): Promise<boolean> {
        return await TeeOffer.contract.methods.isTeeOfferVerifying(this.id).call();
    }

    /**
     * Function for fetching TLB provider from blockchain
     */
    @incrementMethodCall()
    public async getTlb(): Promise<string> {
        const offerInfo = await this.getInfo();

        return offerInfo.tlb;
    }

    /**
     * Function for fetching last TLB addition time for this TEE offer
     */
    public async getLastTlbAddedTime(): Promise<number> {
        this.tlbAddedTime = await TeeOffer.contract.methods.getTeeOfferLastTlbAddedTime().call();

        return this.tlbAddedTime!;
    }

    /**
     * Function for fetching last TCB addition time for this TEE offer
     */
    public async getLastTcbAddedTime(): Promise<number> {
        // this.tcbAddedTime = await TeeOffer.contract.methods.getLastTcbAddedTime().call();
        // return this.tcbAddedTime!;
        // TODO: stub
        return 0;
    }

    /**
     * Function for fetching violationRate for this TEE offer
     */
    public async getViolationRate(): Promise<number> {
        this.violationRate = await TeeOffer.contract.methods.getTeeOfferViolationRate(this.id).call();

        return this.violationRate!;
    }

    /**
     * Function for fetching amount of total locked tokens
     */
    public async getTotalLocked(): Promise<number> {
        // this.totalLocked = await TeeOffer.contract.methods.getTotalLocked().call();
        // return this.totalLocked!;
        // TODO: stub
        return 0;
    }

    /**
     * Fetch new Origins (createdDate, createdBy, modifiedDate and modifiedBy)
     */
    @incrementMethodCall()
    public async getOrigins(): Promise<Origins> {
        let origins = await TeeOffer.contract.methods.getOfferOrigins(this.id).call();

        // Converts blockchain array into object
        origins = tupleToObject(origins, OriginsStructure);

        // Convert blockchain time seconds to js time milliseconds
        origins.createdDate = +origins.createdDate * 1000;
        origins.modifiedDate = +origins.modifiedDate * 1000;

        return (this.origins = origins);
    }

    /**
     * Updates TLB in offer info
     * @param tlb - new TLB
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    @incrementMethodCall()
    public async addTlb(tlb: string, transactionOptions?: TransactionOptions): Promise<void> {
        transactionOptions ?? this.checkInitTeeOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(TeeOffer.contract.methods.setTeeOfferTlb, [this.id, tlb], transactionOptions);
        if (this.offerInfo) this.offerInfo.tlb = tlb;
    }

    /**
     * Updates name in offer info
     * @param name - new name
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async setName(name: string, transactionOptions?: TransactionOptions): Promise<void> {
        transactionOptions ?? this.checkInitTeeOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(TeeOffer.contract.methods.setOfferName, [this.id, name], transactionOptions);
        if (this.offerInfo) this.offerInfo.name = name;
    }

    /**
     * Updates offer info
     * @param newInfo - new offer info
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async setInfo(newInfo: TeeOfferInfo, transactionOptions?: TransactionOptions): Promise<void> {
        transactionOptions ?? this.checkInitTeeOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        const newInfoTuple = objectToTuple(newInfo, TeeOfferInfoStructure);
        await TxManager.execute(TeeOffer.contract.methods.setTeeOfferInfo, [this.id, newInfoTuple], transactionOptions);
        if (this.offerInfo) this.offerInfo = newInfo;
    }

    /**
     * Updates offer hardware info
     * @param newHardwareInfo - new offer hardware info
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async setHardwareInfo(
        newHardwareInfo: HardwareInfo,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        transactionOptions ?? this.checkInitTeeOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        newHardwareInfo = await TeeOffers.packHardwareInfo(newHardwareInfo);
        const newHardwareInfoTuple = objectToTuple(newHardwareInfo, TeeOfferInfoStructure);

        await TxManager.execute(
            TeeOffer.contract.methods.setTeeOfferHardwareInfo,
            [this.id, newHardwareInfoTuple],
            transactionOptions,
        );
    }

    /**
     * Updates description in offer info
     * @param description - new description
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async setDescription(description: string, transactionOptions?: TransactionOptions): Promise<void> {
        transactionOptions ?? this.checkInitTeeOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(
            TeeOffer.contract.methods.setOfferDescription,
            [this.id, description],
            transactionOptions,
        );
        if (this.offerInfo) this.offerInfo.description = description;
    }

    /**
     * Updates argsPublicKey and argsPublicKeyAlgo in order info
     * @param argsPublicKey - new argsPublicKey
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async setKeys(argsPublicKey: string, transactionOptions?: TransactionOptions): Promise<void> {
        transactionOptions ?? this.checkInitTeeOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(
            TeeOffer.contract.methods.setOfferPublicKey,
            [this.id, argsPublicKey],
            transactionOptions,
        );
        if (this.offerInfo) {
            this.offerInfo.argsPublicKey = argsPublicKey;
        }
    }

    /**
     * Function for disabling TEE offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async disable(transactionOptions?: TransactionOptions) {
        transactionOptions ?? this.checkInitTeeOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(TeeOffer.contract.methods.disableOffer, [this.id], transactionOptions);
    }

    /**
     * Function for enabling TEE offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async enable(transactionOptions?: TransactionOptions) {
        transactionOptions ?? this.checkInitTeeOffer(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(TeeOffer.contract.methods.enableOffer, [this.id], transactionOptions);
    }
}

export default TeeOffer;
