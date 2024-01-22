import { Contract } from 'web3';
import { abi } from '../contracts/abi';
import {
  checkIfActionAccountInitialized,
  cleanWeb3Data,
  convertBigIntToString,
} from '../utils/helper';
import { ProviderInfo, Origins, TransactionOptions, BlockchainId, TokenAmount } from '../types';
import { BlockchainConnector } from '../connectors';
import TxManager from '../utils/TxManager';
import Consensus from '../staticModels/Consensus';

class Provider {
  private static contract: Contract<typeof abi>;

  public providerInfo?: ProviderInfo;
  public violationRate?: bigint | string;
  public valueOffers?: BlockchainId[];
  public teeOffers?: BlockchainId[];
  public origins?: Origins;
  public providerId: string;

  constructor(providerId: string) {
    this.providerId = providerId;
    if (!Provider.contract) {
      Provider.contract = BlockchainConnector.getInstance().getContract();
    }
  }

  public async modify(
    providerInfo: ProviderInfo,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      Provider.contract.methods.modifyProvider(providerInfo),
      transactionOptions,
    );
  }

  /**
   * Function for fetching provider info from blockchain
   */
  public async getInfo(): Promise<ProviderInfo> {
    const providerInfoParams = await Provider.contract.methods
      .getProviderInfo(this.providerId)
      .call()
      .then((providerInfo) => cleanWeb3Data(providerInfo) as ProviderInfo);

    return (this.providerInfo = providerInfoParams);
  }

  /**
   * Function for fetching provider authority address from blockchain
   */
  public getAuthority(): string {
    return this.providerId.toString();
  }

  /**
   * Function for fetching all value offers for this provider
   */
  public async getValueOffers(): Promise<BlockchainId[]> {
    this.valueOffers = await Provider.contract.methods
      .getProviderValueOffers(this.providerId)
      .call()
      .then((offers) => offers.map((offer) => offer.toString()));

    return this.valueOffers;
  }

  /**
   * Function for fetching all TEE offers for this provider
   */
  public async getTeeOffers(): Promise<BlockchainId[]> {
    this.teeOffers = await Provider.contract.methods
      .getProviderTeeOffers(this.providerId)
      .call()
      .then((offers) => offers.map((offer) => offer.toString()));

    return this.teeOffers;
  }

  /**
   * Function for fetching violationRate for this provider
   */
  public async getViolationRate(): Promise<bigint | string> {
    return convertBigIntToString(
      await Provider.contract.methods.getProviderViolationRate(this.providerId).call(),
    );
  }

  /**
   * Fetch new Origins (createdDate, createdBy, modifiedDate and modifiedBy)
   */
  public async getOrigins(): Promise<Origins> {
    const origins = await Provider.contract.methods
      .getProviderOrigins(this.providerId)
      .call()
      .then((origins) => cleanWeb3Data(origins) as Origins);

    // Convert blockchain time seconds to js time milliseconds
    origins.createdDate = Number(origins.createdDate) * 1000;
    origins.modifiedDate = Number(origins.modifiedDate) * 1000;

    return (this.origins = origins);
  }

  /**
   * Fetch calculation of required providers security deposit for offers,
   * if additionalAmount is equal zero then deposit will be calculated for existing offers
   * @param additionalAmount - number of tokens planned to be added and frozen as security deposit
   * @returns required deposit
   */
  public getRequiredSecurityDeposit(additionalAmount: TokenAmount = '0'): Promise<TokenAmount> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods.getProviderRequiredSecDepo(this.providerId, additionalAmount).call();
  }

  /**
   * Fetch provider security deposit by provider authority account
   */
  public async getSecurityDeposit(): Promise<TokenAmount> {
    const contract = BlockchainConnector.getInstance().getContract();

    return convertBigIntToString(
      await contract.methods.getProviderSecurityDeposit(this.providerId).call(),
    );
  }

  public async isProviderBanned(): Promise<boolean> {
    const violationRate = await this.getViolationRate();
    const { CONSENSUS_MAX_PENALTIES } = await Consensus.getConstants();

    return Number(violationRate) >= Number(CONSENSUS_MAX_PENALTIES);
  }

  public getOrdersLockedProfitList(): Promise<BlockchainId[]> {
    return Provider.contract.methods
      .getOrdersLockedProfitList(this.providerId)
      .call()
      .then((orders) => orders.map((order) => order.toString()));
  }

  public getTcbLockedProfitList(): Promise<BlockchainId[]> {
    return Provider.contract.methods
      .getTcbLockedProfitList(this.providerId)
      .call()
      .then((tcbIds) => tcbIds.map((tcbId) => tcbId.toString()));
  }
}

export default Provider;
