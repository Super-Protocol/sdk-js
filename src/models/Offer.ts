import { Contract } from 'web3';
import { abi } from '../contracts/abi';
import rootLogger from '../logger';
import {
  checkIfActionAccountInitialized,
  incrementMethodCall,
  packSlotInfo,
  formatOfferSlot,
  convertBigIntToString,
} from '../utils/helper';
import { BlockchainConnector } from '../connectors';
import {
  SlotInfo,
  OptionInfo,
  SlotUsage,
  Origins,
  OfferInfo,
  OfferType,
  ValueOfferSlot,
  TransactionOptions,
} from '../types';
import { formatBytes32String } from 'ethers/lib/utils';
import TeeOffers from '../staticModels/TeeOffers';
import TxManager from '../utils/TxManager';
import { tryWithInterval } from '../utils/helpers';
import { BLOCKCHAIN_CALL_RETRY_INTERVAL, BLOCKCHAIN_CALL_RETRY_ATTEMPTS } from '../constants';

class Offer {
  private static contract: Contract<typeof abi>;
  private logger: typeof rootLogger;

  public offerInfo?: OfferInfo;
  public provider?: string;
  public type?: OfferType;
  public providerAuthority?: string;
  public origins?: Origins;
  public id: bigint;
  public enabled?: boolean;
  public minDeposit?: bigint;

  constructor(offerId: bigint) {
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
   * Function for fetching offer status from blockchain
   */
  @incrementMethodCall()
  public isEnabled(): Promise<boolean> {
    return Offer.contract.methods.isOfferEnabled(this.id).call();
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

    await TxManager.execute(
      Offer.contract.methods.setValueOfferInfo(this.id, newInfo),
      transactionOptions,
    );
    if (this.offerInfo) this.offerInfo = newInfo;
  }

  /**
   * Function for fetching offer info from blockchain
   */
  @incrementMethodCall()
  public async getInfo(): Promise<OfferInfo> {
    if (!(await this.checkIfOfferExistsWithInterval())) {
      throw Error(`Offer ${this.id} does not exist`);
    }
    const { info } = await Offer.contract.methods.getValueOffer(this.id).call();

    this.offerInfo = convertBigIntToString(info) as OfferInfo;

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
    const origins: Origins = await Offer.contract.methods.getOfferOrigins(this.id).call();

    // Convert blockchain time seconds to js time milliseconds
    origins.createdDate = +origins.createdDate * 1000;
    origins.modifiedDate = +origins.modifiedDate * 1000;

    return (this.origins = origins);
  }

  /**
   * Function for fetching offer hold deposit
   */
  @incrementMethodCall()
  public async getMinDeposit(slotId: bigint): Promise<bigint> {
    this.minDeposit = await Offer.contract.methods
      .getOfferMinDeposit(this.id, slotId, '0', [], [])
      .call();

    return this.minDeposit!;
  }

  /**
   * Function for fetching cheapest value offer from blockchain
   */
  @incrementMethodCall()
  public getCheapestPrice(): Promise<bigint> {
    return Offer.contract.methods.getCheapestValueOffersPrice(this.id).call();
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
  public isSlotExists(slotId: bigint): Promise<boolean> {
    return Offer.contract.methods.isValueOfferSlotExists(this.id, slotId).call();
  }

  /**
   * Function for fetching offer slot by id
   * @param slotId - Slot ID
   */
  public async getSlotById(slotId: bigint): Promise<ValueOfferSlot> {
    const slot: ValueOfferSlot = await Offer.contract.methods
      .getValueOfferSlotById(this.id, slotId)
      .call();

    const cpuDenominator = await TeeOffers.getDenominator();

    return formatOfferSlot(slot, cpuDenominator);
  }

  /**
   * @returns this TEE offer slots count
   */
  public getSlotsCount(): Promise<number> {
    return Offer.contract.methods.getValueOfferSlotsCount(this.id).call();
  }

  /**
   * Function for fetching  offer slots info from blockchain
   * @param begin - The first element of range.
   * @param end - One past the final element in the range.
   * @returns {Promise<ValueOfferSlot[]>}
   */
  public async getSlots(begin = 0, end = 999999): Promise<ValueOfferSlot[]> {
    const slotsCount = Number(await Offer.contract.methods.getValueOfferSlotsCount(this.id).call());
    if (slotsCount === 0) {
      return [];
    }

    const slots: ValueOfferSlot[] = await Offer.contract.methods
      .getValueOfferSlots(this.id, begin, end)
      .call();

    const cpuDenominator = await TeeOffers.getDenominator();

    const slotsResult = slots.map((slot) => formatOfferSlot(slot, cpuDenominator));

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
      optionInfo,
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
    slotId: bigint,
    newSlotInfo: SlotInfo,
    newOptionInfo: OptionInfo,
    newUsage: SlotUsage,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    newSlotInfo = packSlotInfo(newSlotInfo, await TeeOffers.getDenominator());
    await TxManager.execute(
      Offer.contract.methods.updateValueOfferSlot(
        this.id,
        slotId,
        newSlotInfo,
        newOptionInfo,
        newUsage,
      ),
      transactionOptions,
    );
  }

  /**
   * Function for delete slot usage from offer
   * @param slotId - Slot ID
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  @incrementMethodCall()
  public async deleteSlot(slotId: bigint, transactionOptions?: TransactionOptions): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      Offer.contract.methods.deleteValueOfferSlot(this.id, slotId),
      transactionOptions,
    );
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
  public isRestrictionsPermitThatOffer(offerId: bigint): Promise<boolean> {
    return Offer.contract.methods.isOfferRestrictionsPermitOtherOffer(this.id, offerId).call();
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
