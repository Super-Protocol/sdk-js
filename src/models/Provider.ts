import { Contract } from 'web3';
import { abi } from '../contracts/abi';
import { checkIfActionAccountInitialized } from '../utils/helper';
import { ProviderInfo, Origins, TransactionOptions } from '../types';
import { BlockchainConnector } from '../connectors';
import TxManager from '../utils/TxManager';
import Consensus from '../staticModels/Consensus';

class Provider {
  private static contract: Contract<typeof abi>;

  public providerInfo?: ProviderInfo;
  public violationRate?: number;
  public authority?: string;
  public valueOffers?: bigint[];
  public teeOffers?: bigint[];
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
      .call();

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
  public async getValueOffers(): Promise<bigint[]> {
    this.valueOffers = await Provider.contract.methods
      .getProviderValueOffers(this.providerId)
      .call();

    return this.valueOffers;
  }

  /**
   * Function for fetching all TEE offers for this provider
   */
  public async getTeeOffers(): Promise<bigint[]> {
    this.teeOffers = await Provider.contract.methods.getProviderTeeOffers(this.providerId).call();

    return this.teeOffers;
  }

  /**
   * Function for fetching violationRate for this provider
   */
  public async getViolationRate(): Promise<number> {
    this.violationRate = Number(
      await Provider.contract.methods.getProviderViolationRate(this.providerId).call(),
    );

    return this.violationRate;
  }

  /**
   * Fetch new Origins (createdDate, createdBy, modifiedDate and modifiedBy)
   */
  public async getOrigins(): Promise<Origins> {
    const origins: Origins = await Provider.contract.methods
      .getProviderOrigins(this.providerId)
      .call();

    // Convert blockchain time seconds to js time milliseconds
    origins.createdDate = +origins.createdDate * 1000;
    origins.modifiedDate = +origins.modifiedDate * 1000;

    return (this.origins = origins);
  }

  public async isProviderBanned(): Promise<boolean> {
    const violationRate = await this.getViolationRate();
    const { CONSENSUS_MAX_PENALTIES } = await Consensus.getConstants();

    return violationRate >= CONSENSUS_MAX_PENALTIES;
  }

  public getOrdersLockedProfitList(): Promise<bigint[]> {
    return Provider.contract.methods.getOrdersLockedProfitList(this.providerId).call();
  }

  public getTcbLockedProfitList(): Promise<bigint[]> {
    return Provider.contract.methods.getTcbLockedProfitList(this.providerId).call();
  }
}

export default Provider;
