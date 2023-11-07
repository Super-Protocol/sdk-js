import { Contract } from 'web3';
import { abi } from '../contracts/abi';
import {
  checkIfActionAccountInitialized,
  incrementMethodCall,
  packSlotInfo,
  formatTeeOfferOption,
  formatTeeOfferSlot,
  cleanWeb3Data,
  convertBigIntToString,
  transformComplexObject,
} from '../utils/helper';
import {
  TeeOfferInfo,
  TransactionOptions,
  OfferType,
  Origins,
  BlockchainId,
  TokenAmount,
} from '../types';
import { BlockchainConnector } from '../connectors';
import TxManager from '../utils/TxManager';
import {
  HardwareInfo,
  TeeOfferOption,
  TeeOfferSlot,
  OptionInfo,
  SlotUsage,
  SlotInfo,
} from '../types';
import { formatBytes32String } from 'ethers/lib/utils';
import TeeOffers from '../staticModels/TeeOffers';
import { TCB } from '../models';
import { TeeConfirmationBlock, GetTcbRequest } from '@super-protocol/dto-js';

class TeeOffer {
  private static contract: Contract<typeof abi>;

  public id: BlockchainId;

  public violationRate?: bigint | string;
  public totalLocked?: TokenAmount;
  public offerInfo?: TeeOfferInfo;

  public type?: OfferType;
  public providerAuthority?: string;
  public provider?: string;
  public enabled?: boolean;
  public tcb?: string;
  public tlbAddedTime?: number;
  public tcbAddedTime?: number;
  public origins?: Origins;
  public isCancelable?: boolean;
  public minDeposit?: TokenAmount;

  constructor(offerId: BlockchainId) {
    this.id = offerId;
    if (!TeeOffer.contract) {
      TeeOffer.contract = BlockchainConnector.getInstance().getContract();
    }
  }

  /**
   * Function for fetching offer status from the blockchain
   */
  @incrementMethodCall()
  public isEnabled(): Promise<boolean> {
    return TeeOffer.contract.methods.isOfferEnabled(this.id).call();
  }

  /**
   * Function for fetching offer hold deposit
   */
  @incrementMethodCall()
  public async getMinDeposit(
    slotId: BlockchainId,
    slotCount: number,
    optionsIds: BlockchainId[],
    optionsCount: number[],
  ): Promise<TokenAmount> {
    this.minDeposit = await TeeOffer.contract.methods
      .getOfferMinDeposit(this.id, slotId, slotCount, optionsIds, optionsCount)
      .call()
      .then((deposit) => deposit.toString());

    return this.minDeposit;
  }

  /**
   * @returns this TEE offer slots count
   */
  public async getSlotsCount(): Promise<number> {
    return Number(await TeeOffer.contract.methods.getTeeOfferSlotsCount(this.id).call());
  }

  /**
   * @returns True if offer is cancelable.
   */
  @incrementMethodCall()
  public async isOfferCancelable(): Promise<boolean> {
    this.isCancelable = await TeeOffer.contract.methods.isOfferCancelable(this.id).call();

    return this.isCancelable;
  }

  /**
   * Function for fetching TEE offer info from blockchain
   */
  @incrementMethodCall()
  public async getInfo(): Promise<TeeOfferInfo> {
    const { info } = await TeeOffer.contract.methods.getTeeOffer(this.id).call();

    this.offerInfo = cleanWeb3Data(info) as TeeOfferInfo;
    this.offerInfo.hardwareInfo = await TeeOffers.unpackHardwareInfo(this.offerInfo.hardwareInfo);

    return this.offerInfo;
  }

  /**
   * Function for fetching TEE offer hardware info from blockchain
   */
  @incrementMethodCall()
  public async getHardwareInfo(): Promise<HardwareInfo> {
    const hardwareInfo: HardwareInfo = await TeeOffer.contract.methods
      .getTeeOfferHardwareInfo(this.id)
      .call()
      .then((response) => cleanWeb3Data(response) as HardwareInfo);

    return TeeOffers.unpackHardwareInfo(hardwareInfo);
  }

  /**
   * Function for fetching tee offer slot by id
   * @param optionId - Slot ID
   */
  public getOptionById(optionId: BlockchainId): Promise<TeeOfferOption> {
    return TeeOffer.contract.methods
      .getOptionById(optionId)
      .call()
      .then((option) => formatTeeOfferOption(option as TeeOfferOption));
  }

  public async getOptions(begin = 0, end = 999999): Promise<TeeOfferOption[]> {
    const optionsCount = Number(
      await TeeOffer.contract.methods.getTeeOfferOptionsCount(this.id).call(),
    );
    if (optionsCount === 0) {
      return [];
    }

    const teeOfferOption: TeeOfferOption[] = await TeeOffer.contract.methods
      .getTeeOfferOptions(this.id, begin, end)
      .call()
      .then((options) => options.map((option) => transformComplexObject(option)));

    return teeOfferOption.map((option) => formatTeeOfferOption(option));
  }

  /**
   * Function for fetching whether tee offer slot exists or not
   * @param optionId - Option ID
   */
  public isOptionExists(optionId: BlockchainId): Promise<boolean> {
    return TeeOffer.contract.methods.isTeeOfferSlotExists(this.id, optionId).call();
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
    externalId = 'default',
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    const formattedExternalId = formatBytes32String(externalId);
    await TxManager.execute(
      contract.methods.addOption(this.id, formattedExternalId, info, usage),
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
    optionId: BlockchainId,
    newInfo: OptionInfo,
    newUsage: SlotUsage,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      TeeOffer.contract.methods.updateOption(this.id, optionId, newInfo, newUsage),
      transactionOptions,
    );
  }

  /**
   * Function for delete option
   * @param optionId - Option ID
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  @incrementMethodCall()
  public async deleteOption(
    optionId: BlockchainId,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      TeeOffer.contract.methods.deleteOption(this.id, optionId),
      transactionOptions,
    );
  }

  @incrementMethodCall()
  public async initializeTcb(transactionOptions?: TransactionOptions): Promise<void> {
    checkIfActionAccountInitialized();

    await TxManager.execute(TeeOffer.contract.methods.initializeTcb(this.id), transactionOptions);
  }

  @incrementMethodCall()
  private async initializeTcbAndAssignBlocks(
    transactionOptions?: TransactionOptions,
  ): Promise<TCB> {
    await this.initializeTcb(transactionOptions);
    const tcbId = await this.getInitializedTcbId();
    const tcb = new TCB(tcbId);

    await tcb.assignLastBlocksToCheck(transactionOptions);
    await tcb.assignSuspiciousBlocksToCheck(transactionOptions);

    return tcb;
  }

  /**
   * Function initialize TCB and returns list of anothers' TCB for their checking
   * @param teeOfferId - id of TEE offer
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   * @returns tcbId and lists of anothers' TCB for their checking
   */
  @incrementMethodCall()
  public async getListsForVerification(
    transactionOptions?: TransactionOptions,
  ): Promise<GetTcbRequest> {
    checkIfActionAccountInitialized();

    const tcb = await this.initializeTcbAndAssignBlocks(transactionOptions);
    const { blocksIds } = await tcb.getCheckingBlocksMarks();
    const tcbsForVerification: TeeConfirmationBlock[] = [];

    for (let blockIndex = 0; blockIndex < blocksIds.length; blockIndex++) {
      const tcb = new TCB(blocksIds[blockIndex]);
      const tcbInfo = await tcb.get();
      tcbsForVerification.push({
        tcbId: blocksIds[blockIndex].toString(),
        deviceId: tcbInfo.publicData.deviceID,
        properties: tcbInfo.publicData.properties,
        benchmark: tcbInfo.publicData.benchmark,
        quote: tcbInfo.quote,
        marks: tcbInfo.utilData.checkingBlockMarks,
        checkingBlocks: tcbInfo.utilData.checkingBlocks.map((x) => x.toString()),
      });
    }

    return {
      tcbId: tcb.tcbId.toString(),
      tcbsForVerification,
    };
  }

  /**
   * Function for fetching whether tee offer slot exists or not
   * @param slotId - Slot ID
   */
  public isSlotExists(slotId: BlockchainId): Promise<boolean> {
    return TeeOffer.contract.methods.isTeeOfferSlotExists(this.id, slotId).call();
  }

  /**
   * Function for fetching tee offer slot by id
   * @param slotId - Slot ID
   */
  public async getSlotById(slotId: BlockchainId): Promise<TeeOfferSlot> {
    const slot: TeeOfferSlot = await TeeOffer.contract.methods
      .getTeeOfferSlotById(this.id, slotId)
      .call();

    const cpuDenominator = await TeeOffers.getDenominator();

    return formatTeeOfferSlot(slot, cpuDenominator);
  }

  /**
   * Function for fetching TEE offer slots info from blockchain
   * @param begin - The first element of range.
   * @param end - One past the final element in the range.
   * @returns {Promise<TeeOfferSlot[]>}
   */
  public async getSlots(begin = 0, end = 999999): Promise<TeeOfferSlot[]> {
    const teeOfferSlotsCount = Number(
      await TeeOffer.contract.methods.getTeeOfferSlotsCount(this.id).call(),
    );
    if (teeOfferSlotsCount === 0) {
      return [];
    }

    const slots: TeeOfferSlot[] = await TeeOffer.contract.methods
      .getTeeOfferSlots(this.id, begin, end)
      .call()
      .then((slots) => slots.map((slot) => transformComplexObject(slot)));
    const cpuDenominator = await TeeOffers.getDenominator();

    const slotsResult = slots.map((slot) =>
      formatTeeOfferSlot(slot as TeeOfferSlot, cpuDenominator),
    );

    return slotsResult;
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
    externalId = 'default',
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    info = packSlotInfo(info, await TeeOffers.getDenominator());
    const formattedExternalId = formatBytes32String(externalId);
    await TxManager.execute(
      TeeOffer.contract.methods.addTeeOfferSlot(this.id, formattedExternalId, info, usage),
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
    slotId: BlockchainId,
    newInfo: SlotInfo,
    newUsage: SlotUsage,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    newInfo = packSlotInfo(newInfo, await TeeOffers.getDenominator());
    await TxManager.execute(
      TeeOffer.contract.methods.updateTeeOfferSlot(this.id, slotId, newInfo, newUsage),
      transactionOptions,
    );
  }

  /**
   * Function for delete slot usage to the tee offer
   * @param slotId - Slot ID
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  @incrementMethodCall()
  public async deleteSlot(
    slotId: BlockchainId,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      TeeOffer.contract.methods.deleteTeeOfferSlot(this.id, slotId),
      transactionOptions,
    );
  }

  /**
   * @param teeOfferId - TEE offer ID
   * @returns {Promise<string>} - Actual TCB ID
   */
  public getActualTcbId(): Promise<BlockchainId> {
    return TeeOffer.contract.methods.getActualTcbId(this.id).call();
  }

  /**
   * Function return last inited TCB of TEE offer
   * @param teeOfferId - id of TEE offer
   * */
  public getInitializedTcbId(): Promise<BlockchainId> {
    return TeeOffer.contract.methods.getInitializedTcbId(this.id).call();
  }

  public async isTcbCreationAvailable(): Promise<boolean> {
    const { offerNotBlocked, newEpochStarted, halfEpochPassed, benchmarkVerified } =
      await TeeOffer.contract.methods.isTcbCreationAvailable(this.id).call();

    return offerNotBlocked && newEpochStarted && halfEpochPassed && benchmarkVerified;
  }

  /**
   * Function for fetching TEE offer provider authority account from blockchain
   */
  @incrementMethodCall()
  public async getProviderAuthority(): Promise<string> {
    this.providerAuthority = await TeeOffer.contract.methods
      .getOfferProviderAuthority(this.id)
      .call();

    return this.providerAuthority;
  }

  /**
   * Fetch offer type from blockchain (works for TEE and Value offers)
   */
  @incrementMethodCall()
  public async getOfferType(): Promise<OfferType> {
    this.type = await TeeOffer.contract.methods.getOfferType(this.id).call();

    return this.type.toString() as OfferType;
  }

  @incrementMethodCall()
  public isTeeOfferVerifying(): Promise<boolean> {
    return TeeOffer.contract.methods.isTeeOfferVerifying(this.id).call();
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
   * Function for fetching violationRate for this TEE offer
   */
  public async getViolationRate(): Promise<bigint | string> {
    this.violationRate = convertBigIntToString(
      await TeeOffer.contract.methods.getTeeOfferViolationRate(this.id).call(),
    );

    return this.violationRate!;
  }

  /**
   * Fetch new Origins (createdDate, createdBy, modifiedDate and modifiedBy)
   */
  @incrementMethodCall()
  public async getOrigins(): Promise<Origins> {
    const origins: Origins = await TeeOffer.contract.methods
      .getOfferOrigins(this.id)
      .call()
      .then((origins) => cleanWeb3Data(origins) as Origins);

    // Convert blockchain time seconds to js time milliseconds
    origins.createdDate = origins.createdDate * 1000;
    origins.modifiedDate = origins.modifiedDate * 1000;

    return (this.origins = origins);
  }

  /**
   * Updates TLB in offer info
   * @param tlb - new TLB
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  @incrementMethodCall()
  public async addTlb(tlb: string, transactionOptions?: TransactionOptions): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      TeeOffer.contract.methods.setTeeOfferTlb(this.id, tlb),
      transactionOptions,
    );
    if (this.offerInfo) this.offerInfo.tlb = tlb;
  }

  /**
   * Updates name in offer info
   * @param name - new name
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public async setName(name: string, transactionOptions?: TransactionOptions): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      TeeOffer.contract.methods.setOfferName(this.id, name),
      transactionOptions,
    );
    if (this.offerInfo) this.offerInfo.name = name;
  }

  /**
   * Updates offer info
   * @param newInfo - new offer info
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public async setInfo(
    newInfo: TeeOfferInfo,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    newInfo.hardwareInfo = await TeeOffers.packHardwareInfo(newInfo.hardwareInfo);

    await TxManager.execute(
      TeeOffer.contract.methods.setTeeOfferInfo(this.id, newInfo),
      transactionOptions,
    );
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
    checkIfActionAccountInitialized(transactionOptions);

    newHardwareInfo = await TeeOffers.packHardwareInfo(newHardwareInfo);

    await TxManager.execute(
      TeeOffer.contract.methods.setTeeOfferHardwareInfo(this.id, newHardwareInfo),
      transactionOptions,
    );
  }

  /**
   * Updates description in offer info
   * @param description - new description
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public async setDescription(
    description: string,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      TeeOffer.contract.methods.setOfferDescription(this.id, description),
      transactionOptions,
    );
    if (this.offerInfo) this.offerInfo.description = description;
  }

  /**
   * Updates argsPublicKey and argsPublicKeyAlgo in order info
   * @param argsPublicKey - new argsPublicKey
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public async setKeys(
    argsPublicKey: string,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      TeeOffer.contract.methods.setOfferPublicKey(this.id, argsPublicKey),
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
  public async disable(transactionOptions?: TransactionOptions): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(TeeOffer.contract.methods.disableOffer(this.id), transactionOptions);
  }

  /**
   * Function for enabling TEE offer
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public async enable(transactionOptions?: TransactionOptions): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(TeeOffer.contract.methods.enableOffer(this.id), transactionOptions);
  }
}

export default TeeOffer;
