import { Contract } from 'web3';
import { abi } from '../contracts/abi.js';
import {
  checkIfActionAccountInitialized,
  incrementMethodCall,
  packSlotInfo,
  convertTeeOfferOptionFromRaw,
  formatTeeOfferSlot,
  cleanWeb3Data,
  convertBigIntToString,
  transformComplexObject,
  convertOptionInfoFromRaw,
  convertOptionInfoToRaw,
  packDeviceId,
} from '../utils/helper.js';
import {
  TeeOfferInfo,
  TransactionOptions,
  OfferType,
  Origins,
  BlockchainId,
  TokenAmount,
  OptionInfoRaw,
  TeeOfferOptionRaw,
  OfferVersionInfo,
  OfferVersion,
  TeeOfferSubtype,
} from '../types/index.js';
import { BlockchainConnector } from '../connectors/index.js';
import TxManager from '../utils/TxManager.js';
import {
  HardwareInfo,
  TeeOfferOption,
  TeeOfferSlot,
  OptionInfo,
  SlotUsage,
  SlotInfo,
} from '../types/index.js';
import { formatBytes32String } from 'ethers/lib/utils.js';
import TeeOffers from '../staticModels/TeeOffers.js';
import { TCB } from '../models/index.js';
import { TeeConfirmationBlock, GetTcbRequest, TcbVerifiedStatus } from '@super-protocol/dto-js';
import Consensus from '../staticModels/Consensus.js';

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
    const { tlb_DEPRECATED: _tlb_DEPRECATED, subtype: _subtype, ...offerInfo } = cleanWeb3Data({
      ...info,
      subType: info.subtype,
      hardwareInfo: (await this.getHardwareInfo()) as HardwareInfo,
    });

    this.offerInfo = offerInfo as TeeOfferInfo;

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
      .then((response) => {
        return {
          slotInfo: cleanWeb3Data(response[0]) as SlotInfo,
          optionInfo: convertOptionInfoFromRaw(cleanWeb3Data(response[1]) as OptionInfoRaw),
        } as HardwareInfo;
      });

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
      .then((option) => convertTeeOfferOptionFromRaw(option as TeeOfferOptionRaw));
  }

  public async getOptions(begin = 0, end = 999999): Promise<TeeOfferOption[]> {
    const optionsCount = Number(
      await TeeOffer.contract.methods.getTeeOfferOptionsCount(this.id).call(),
    );
    if (optionsCount === 0) {
      return [];
    }

    const teeOfferOption: TeeOfferOptionRaw[] = await TeeOffer.contract.methods
      .getTeeOfferOptions(this.id, begin, end)
      .call()
      .then((options) => options.map((option) => transformComplexObject(option)));

    return teeOfferOption.map((option) => convertTeeOfferOptionFromRaw(option));
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
      contract.methods.addOption(this.id, formattedExternalId, convertOptionInfoToRaw(info), usage),
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
      TeeOffer.contract.methods.updateOptionInfo(
        this.id,
        optionId,
        convertOptionInfoToRaw(newInfo),
      ),
      transactionOptions,
    );

    await TxManager.execute(
      TeeOffer.contract.methods.updateOptionUsage(this.id, optionId, newUsage),
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
  private async initializeTcb(
    deviceId: string,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized();

    await TxManager.execute(
      TeeOffer.contract.methods.initializeTcb(this.id, deviceId),
      transactionOptions,
    );
  }

  @incrementMethodCall()
  private async initializeTcbAndAssignBlocks(
    deviceId: string,
    transactionOptions?: TransactionOptions,
  ): Promise<TCB> {
    await this.initializeTcb(deviceId, transactionOptions);
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
    deviceId: string,
    transactionOptions?: TransactionOptions,
  ): Promise<GetTcbRequest> {
    checkIfActionAccountInitialized();

    deviceId = packDeviceId(deviceId);
    const tcb = await this.initializeTcbAndAssignBlocks(deviceId, transactionOptions);
    const { checkingTcbIds } = await tcb.getPublicData();
    const tcbsPublicData = await Consensus.getTcbsPublicData(checkingTcbIds);
    const tcbsUtilityData = await Consensus.getTcbsUtilityData(checkingTcbIds);

    const tcbsForVerification: TeeConfirmationBlock[] = [];
    for (const checkingTcbId of checkingTcbIds) {
      const { checkingTcbMarks, ...otherPublicData } = tcbsPublicData[checkingTcbId];
      const { quote, pubKey } = tcbsUtilityData[checkingTcbId];
      tcbsForVerification.push({
        ...otherPublicData,
        checkingTcbId,
        checkingTcbMarks: checkingTcbMarks.map((mark) => mark as TcbVerifiedStatus),
        pubKey,
        quote,
      });
    }

    return {
      tcbId: tcb.tcbId.toString(),
      tcbsForVerification,
    };
  }

  /**
   * Returns the offer version info.
   */
  @incrementMethodCall()
  public async getVersion(version: number): Promise<OfferVersion> {
    return await TeeOffer.contract.methods
      .getOfferVersion(this.id, version)
      .call()
      .then((offerVersion) => cleanWeb3Data(offerVersion) as OfferVersion);
  }

  /**
   * Returns the offer version info.
   */
  @incrementMethodCall()
  public async getVersionCount(): Promise<number> {
    return await TeeOffer.contract.methods.getOfferVersionsCount(this.id).call();
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

    const coresDenominator = await TeeOffers.getDenominator();

    return formatTeeOfferSlot(slot, coresDenominator);
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
    const coresDenominator = await TeeOffers.getDenominator();

    const slotsResult = slots.map((slot) =>
      formatTeeOfferSlot(slot as TeeOfferSlot, coresDenominator),
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
      TeeOffer.contract.methods.updateTeeOfferSlotInfo(this.id, slotId, newInfo, newUsage),
      transactionOptions,
    );
    await TxManager.execute(
      TeeOffer.contract.methods.updateTeeOfferSlotUsage(this.id, slotId, newUsage),
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
   * Function for add a new version to the value offer.
   * @param newVersion - Version number
   * @param versionInfo - Version info
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  @incrementMethodCall()
  public async setNewVersion(
    newVersion: number,
    versionInfo: OfferVersionInfo,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    const transactionCall = TeeOffer.contract.methods.setOfferNewVersion(
      this.id,
      newVersion,
      versionInfo,
    );
    await TxManager.execute(transactionCall, transactionOptions);
  }

  /**
   * Functcion for deletion the version from the value offer.
   * @param newVersion - Version number
   * @param versionInfo - Version info
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  @incrementMethodCall()
  public async deleteVersion(
    version: number,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    const transactionCall = TeeOffer.contract.methods.deleteOfferVersion(this.id, version);
    await TxManager.execute(transactionCall, transactionOptions);
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

  public async isTcbCreationAvailable(deviceId: string): Promise<boolean> {
    const { offerNotBlocked, newEpochStarted, halfEpochPassed, benchmarkVerified } = cleanWeb3Data(
      await TeeOffer.contract.methods
        .isTcbCreationAvailable(this.id, packDeviceId(deviceId))
        .call(),
    );

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

  /**
   * Fetch offer subtype from blockchain (TEE only)
   */
  @incrementMethodCall()
  public async getSubtype(): Promise<TeeOfferSubtype> {
    this.type = await TeeOffer.contract.methods.getTeeOfferSubtype(this.id).call();

    return this.type.toString() as TeeOfferSubtype;
  }

  @incrementMethodCall()
  public isTeeOfferVerifying(): Promise<boolean> {
    return TeeOffer.contract.methods.isTeeOfferVerified(this.id).call();
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

    const { hardwareInfo, subType, ...offerInfo } = newInfo;

    await this.setHardwareInfo(hardwareInfo, transactionOptions);

    await TxManager.execute(
      TeeOffer.contract.methods.setTeeOfferInfo(this.id, {
        ...offerInfo,
        subtype: subType,
        tlb_DEPRECATED: '',
      }),
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
      TeeOffer.contract.methods.setTeeOfferHardwareInfo(
        this.id,
        newHardwareInfo.slotInfo,
        convertOptionInfoToRaw(newHardwareInfo.optionInfo),
      ),
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
   * Function for set the offer subtype.
   * @param newSubtype - TEE offer subtype
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  @incrementMethodCall()
  public async setSubtype(
    newSubtype: TeeOfferSubtype,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    const transactionCall = TeeOffer.contract.methods.setTeeOfferSubtype(this.id, newSubtype);
    await TxManager.execute(transactionCall, transactionOptions);
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
