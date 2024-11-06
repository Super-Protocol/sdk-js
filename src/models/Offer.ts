import { Contract } from 'web3';
import { abi } from '../contracts/abi.js';
import rootLogger from '../logger.js';
import {
  checkIfActionAccountInitialized,
  incrementMethodCall,
  packSlotInfo,
  formatOfferSlot,
  cleanWeb3Data,
  convertBigIntToString,
  transformComplexObject,
  convertOptionInfoToRaw,
} from '../utils/helper.js';
import { BlockchainConnector } from '../connectors/index.js';
import {
  SlotInfo,
  OptionInfo,
  SlotUsage,
  Origins,
  OfferInfo,
  OfferType,
  ValueOfferSlot,
  TransactionOptions,
  BlockchainId,
  ValueOfferRestrictionsSpecification,
  TokenAmount,
  ValueOfferSlotRaw,
  OfferVersionInfo,
  OfferVersion,
  ValueOfferSubtype,
} from '../types/index.js';
import { formatBytes32String } from 'ethers/lib/utils.js';
import TeeOffers from '../staticModels/TeeOffers.js';
import TxManager from '../utils/TxManager.js';
import { tryWithInterval } from '../utils/helpers/index.js';
import {
  BLOCKCHAIN_CALL_RETRY_INTERVAL,
  BLOCKCHAIN_CALL_RETRY_ATTEMPTS,
  DEFAULT_OFFER_VERSION,
} from '../constants.js';

class Offer {
  private static contract: Contract<typeof abi>;
  private logger: typeof rootLogger;

  public offerInfo?: OfferInfo;
  public provider?: string;
  public type?: OfferType;
  public providerAuthority?: string;
  public origins?: Origins;
  public id: BlockchainId;
  public enabled?: boolean;
  public minDeposit?: TokenAmount;

  constructor(offerId: BlockchainId) {
    this.id = offerId;
    if (!Offer.contract) {
      Offer.contract = BlockchainConnector.getInstance().getContract();
    }
    this.logger = rootLogger.child({
      className: 'Offer',
      offerId: this.id,
    });
  }

  /**
   * Checks if the offer is enabled
   */
  @incrementMethodCall()
  public isEnabled(): Promise<boolean> {
    return Offer.contract.methods.isOfferEnabled(this.id).call();
  }

  /**
   * Checks if the offer is base image
   */
  @incrementMethodCall()
  public async isBaseImage(): Promise<boolean> {
    const info = this.offerInfo ?? (await this.getInfo());
    if (info.offerType !== OfferType.Solution) {
      return false;
    }

    const isRestrictedBySolution = this.offerInfo?.restrictions.types.includes(OfferType.Solution);
    return !isRestrictedBySolution;
  }

  /**
   * Checks if the offer has public data
   */
  @incrementMethodCall()
  public async isOfferPublic(): Promise<boolean> {
    const info = this.offerInfo ?? (await this.getInfo());
    return Boolean(info.resultResource);
  }

  /**
   * Updates name in offer info
   * @param name - new name
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public async setName(name: string, transactionOptions?: TransactionOptions): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(Offer.contract.methods.setOfferName(this.id, name), transactionOptions);
    if (this.offerInfo) this.offerInfo.name = name;
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
      Offer.contract.methods.setOfferDescription(this.id, description),
      transactionOptions,
    );
    if (this.offerInfo) this.offerInfo.description = description;
  }

  /**
   * Updates offer info
   * @param newInfo - new offer info
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public async setInfo(newInfo: OfferInfo, transactionOptions?: TransactionOptions): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    const { restrictions, linkage, subType, offerType, ...restInfo } = newInfo;
    await TxManager.execute(
      Offer.contract.methods.setValueOfferInfo(this.id, {
        ...restInfo,
        subtype: subType,
        linkage_DEPRECATED: linkage,
        offerType_DEPRECATED: offerType,
      }),
      transactionOptions,
    );

    await TxManager.execute(
      Offer.contract.methods.setValueOfferRestrictionsSpecification(this.id, restrictions),
      transactionOptions,
    );
    if (this.offerInfo) this.offerInfo = newInfo;
  }

  /**
   * Updates offer restrictions
   * @param restrictions - new offer restrictions
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public async setRestrictions(
    restrictions: ValueOfferRestrictionsSpecification,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      Offer.contract.methods.setValueOfferRestrictionsSpecification(this.id, restrictions),
      transactionOptions,
    );
    if (this.offerInfo) this.offerInfo.restrictions = restrictions;
  }

  @incrementMethodCall()
  public async getInfo(): Promise<OfferInfo> {
    if (!(await this.checkIfOfferExistsWithInterval())) {
      throw Error(`Offer ${this.id} does not exist`);
    }
    const { info, offerType } = await Offer.contract.methods.getValueOffer(this.id).call();
    const offerGroup = await Offer.contract.methods.getOfferGroup(this.id).call();
    // eslint-disable-next-line unused-imports/no-unused-vars
    const { linkage_DEPRECATED, group_DEPRECATED, offerType_DEPRECATED, subtype, ...restInfo } =
      info;
    this.offerInfo = cleanWeb3Data({
      ...restInfo,
      subType: subtype,
      group: offerGroup,
      offerType: offerType,
      linkage: linkage_DEPRECATED,
    }) as OfferInfo;

    const offerRestrictions = await Offer.contract.methods
      .getOfferRestrictionsSpecification(this.id)
      .call();
    this.offerInfo.restrictions = cleanWeb3Data(
      offerRestrictions,
    ) as ValueOfferRestrictionsSpecification;

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

    return this.type!.toString() as OfferType;
  }

  /**
   * Fetch offer subtype from blockchain (Value only)
   */
  @incrementMethodCall()
  public async getSubtype(): Promise<ValueOfferSubtype> {
    this.type = await Offer.contract.methods.getValueOfferSubtype(this.id).call();

    return this.type.toString() as ValueOfferSubtype;
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
   * Function for fetching TEE offer provider action account from blockchain
   */
  @incrementMethodCall()
  public getProviderActionAccount(): Promise<string> {
    return Offer.contract.methods.getOfferProviderActionAccount(this.id).call();
  }

  /**
   * Fetch new Origins (createdDate, createdBy, modifiedDate and modifiedBy)
   */
  @incrementMethodCall()
  public async getOrigins(): Promise<Origins> {
    const origins: Origins = await Offer.contract.methods
      .getOfferOrigins(this.id)
      .call()
      .then((origins) => cleanWeb3Data(origins) as Origins);

    // Convert blockchain time seconds to js time milliseconds
    origins.createdDate = Number(origins.createdDate) * 1000;
    origins.modifiedDate = Number(origins.modifiedDate) * 1000;

    return (this.origins = origins);
  }

  /**
   * Function for fetching offer hold deposit
   */
  @incrementMethodCall()
  public async getMinDeposit(slotId: BlockchainId): Promise<TokenAmount> {
    this.minDeposit = await Offer.contract.methods
      .getOfferMinDeposit(this.id, slotId, '0', [], [])
      .call()
      .then((price) => convertBigIntToString(price) as TokenAmount);

    return this.minDeposit!;
  }

  /**
   * Function for fetching cheapest value offer from blockchain
   */
  @incrementMethodCall()
  public getCheapestPrice(): Promise<TokenAmount> {
    return Offer.contract.methods
      .getCheapestValueOffersPrice(this.id)
      .call()
      .then((price) => convertBigIntToString(price) as TokenAmount);
  }

  /**
   * Returns the offer version info.
   */
  @incrementMethodCall()
  public async getVersion(version: number): Promise<OfferVersion> {
    return await Offer.contract.methods
      .getOfferVersion(this.id, version)
      .call()
      .then((offerVersion) => cleanWeb3Data(offerVersion) as OfferVersion);
  }

  /**
   * Returns the offer version info.
   */
  @incrementMethodCall()
  public async getVersionCount(): Promise<number> {
    return await Offer.contract.methods.getOfferVersionsCount(this.id).call();
  }

  @incrementMethodCall()
  public isOfferExists(): Promise<boolean> {
    return Offer.contract.methods.isOfferExists(this.id).call();
  }

  private async checkIfOfferExistsWithInterval(): Promise<boolean> {
    const offerExists = await tryWithInterval({
      handler: () => this.isOfferExists(),
      checkResult: (exists) => {
        if (!exists) this.logger.debug(`Offer ${this.id} exists: ${exists}`);

        return { isResultOk: exists };
      },
      retryInterval: BLOCKCHAIN_CALL_RETRY_INTERVAL,
      retryMax: BLOCKCHAIN_CALL_RETRY_ATTEMPTS,
    });

    return offerExists;
  }

  /**
   * Function for fetching whether offer slot exists or not
   * @param slotId - Slot ID
   */
  public isSlotExists(slotId: BlockchainId): Promise<boolean> {
    return Offer.contract.methods.isValueOfferSlotExists(this.id, slotId).call();
  }

  /**
   * Function for fetching offer slot by id
   * @param slotId - Slot ID
   */
  public async getSlotById(slotId: BlockchainId): Promise<ValueOfferSlot> {
    const slot: ValueOfferSlotRaw = await Offer.contract.methods
      .getValueOfferSlotById(this.id, slotId)
      .call();

    const coresDenominator = await TeeOffers.getDenominator();

    return formatOfferSlot(slot, coresDenominator);
  }

  /**
   * @returns this TEE offer slots count
   */
  public async getSlotsCount(): Promise<number> {
    return Number(await Offer.contract.methods.getValueOfferSlotsCount(this.id).call());
  }

  /**
   * Function for fetching  offer slots info from blockchain
   * @param begin - The first element of range.
   * @param end - One past the final element in the range.
   */
  public async getSlots(begin = 0, end = 999999): Promise<ValueOfferSlot[]> {
    const slotsCount = Number(await Offer.contract.methods.getValueOfferSlotsCount(this.id).call());
    if (slotsCount === 0) {
      return [];
    }

    const slots: ValueOfferSlotRaw[] = await Offer.contract.methods
      .getValueOfferSlots(this.id, begin, end)
      .call()
      .then((slots) => slots.map((slot) => transformComplexObject(slot)));

    const coresDenominator = await TeeOffers.getDenominator();

    const slotsResult = slots.map((slot) => formatOfferSlot(slot, coresDenominator));

    return slotsResult;
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
    externalId = 'default',
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    slotInfo = packSlotInfo(slotInfo, await TeeOffers.getDenominator());
    const formattedExternalId = formatBytes32String(externalId);
    const transactionCall = Offer.contract.methods.addValueOfferSlot(
      this.id,
      formattedExternalId,
      slotInfo,
      convertOptionInfoToRaw(optionInfo),
      slotUsage,
    );
    await TxManager.execute(transactionCall, transactionOptions);
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
    slotId: BlockchainId,
    newSlotInfo: SlotInfo,
    newOptionInfo: OptionInfo,
    newUsage: SlotUsage,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    newSlotInfo = packSlotInfo(newSlotInfo, await TeeOffers.getDenominator());
    await TxManager.execute(
      Offer.contract.methods.updateValueOfferSlotInfo(this.id, slotId, newSlotInfo),
      transactionOptions,
    );
    await TxManager.execute(
      Offer.contract.methods.updateValueOfferSlotOption(
        this.id,
        slotId,
        convertOptionInfoToRaw(newOptionInfo),
      ),
      transactionOptions,
    );
    await TxManager.execute(
      Offer.contract.methods.updateValueOfferSlotUsage(this.id, slotId, newUsage),
      transactionOptions,
    );
  }

  /**
   * Function for delete slot usage from offer
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
      Offer.contract.methods.deleteValueOfferSlot(this.id, slotId),
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

    const transactionCall = Offer.contract.methods.setOfferNewVersion(
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

    const transactionCall = Offer.contract.methods.deleteOfferVersion(this.id, version);
    await TxManager.execute(transactionCall, transactionOptions);
  }
  /**
   * Function for set the value offer subtype.
   * @param newSubtype - value offer subtype
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  @incrementMethodCall()
  public async setSubtype(
    newSubtype: ValueOfferSubtype,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    const transactionCall = Offer.contract.methods.setTeeOfferSubtype(this.id, newSubtype);
    await TxManager.execute(transactionCall, transactionOptions);
  }

  /**
   * Function for disabling offer
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public async disable(transactionOptions?: TransactionOptions): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(Offer.contract.methods.disableOffer(this.id), transactionOptions);
  }

  /**
   * Function for enabling offer
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public async enable(transactionOptions?: TransactionOptions): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(Offer.contract.methods.enableOffer(this.id), transactionOptions);
  }

  /**
   * Checks if passed offer match restrictions in this offer
   * @param offerId - id of offer what needs to be checked
   */
  @incrementMethodCall()
  public isRestrictionsPermitThatOffer(
    offerId: BlockchainId,
    offerVersion: number = DEFAULT_OFFER_VERSION,
  ): Promise<boolean> {
    return Offer.contract.methods
      .isOfferRestrictionsPermitOtherOffer(this.id, offerId, offerVersion)
      .call();
  }

  /**
   * Checks if this offer contains restrictions of a certain type
   * @param type - type of offer which needs to be checked
   */
  @incrementMethodCall()
  public isRestrictedByOfferType(type: OfferType): Promise<boolean> {
    return Offer.contract.methods.isOfferRestrictedByOfferType(this.id, type).call();
  }
}

export default Offer;
