import { Contract, TransactionReceipt } from 'web3';
import { abi } from '../contracts/abi.js';
import TxManager from '../utils/TxManager.js';
import { BlockchainConnector } from '../connectors/index.js';
import {
  BlockchainId,
  TcbData,
  TcbPublicData,
  TcbUtilityData,
  TransactionOptions,
} from '../types/index.js';
import { TcbVerifiedStatus } from '@super-protocol/dto-js';
import { checkIfActionAccountInitialized, cleanWeb3Data, packDeviceId } from '../utils/helper.js';
import Consensus from '../staticModels/Consensus.js';
import rootLogger from '../logger.js';

class TCB {
  private static readonly logger = rootLogger.child({ className: 'TCB' });
  public tcbId: BlockchainId;
  private static contract: Contract<typeof abi>;

  constructor(tcbId: BlockchainId) {
    this.tcbId = tcbId;
    if (!TCB.contract) {
      TCB.contract = BlockchainConnector.getInstance().getContract();
    }
  }

  private applyTcbMarks(
    marks: TcbVerifiedStatus[],
    transactionOptions?: TransactionOptions,
  ): Promise<TransactionReceipt> {
    return TxManager.execute(
      TCB.contract.methods.applyTcbMarks(marks, this.tcbId),
      transactionOptions,
    );
  }

  private setTcbData(
    publicData: TcbPublicData,
    quote: string,
    publicKey: string,
    transactionOptions?: TransactionOptions,
  ): Promise<TransactionReceipt> {
    checkIfActionAccountInitialized(transactionOptions);

    const formattedDeviceId = packDeviceId(publicData.deviceId);
    return TxManager.execute(
      TCB.contract.methods.setTcbData(
        this.tcbId,
        publicData.benchmark,
        publicData.properties,
        formattedDeviceId,
        quote,
        publicKey,
      ),
      transactionOptions,
    );
  }

  /**
   * Add data to TeeConfirmationBlock and push it to Consensus
   * @param pb - struct of 'processed' data
   * @param quote - data generated from Enclave
   * @param marks - list of marks
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  private addToSupply(transactionOptions?: TransactionOptions): Promise<TransactionReceipt> {
    checkIfActionAccountInitialized(transactionOptions);

    return TxManager.execute(TCB.contract.methods.addTcbToSupply(this.tcbId), transactionOptions);
  }

  public async apply(
    publicData: TcbPublicData,
    quote: string,
    publicKey: string,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const logger = TCB.logger.child({
      deviceId: publicData.deviceId,
      method: 'apply',
    });

    try {
      logger.debug('apply tcb marks');
      await this.applyTcbMarks(publicData.checkingTcbMarks, transactionOptions);
      logger.debug('set tcb data');
      await this.setTcbData(publicData, quote, publicKey, transactionOptions);
      logger.debug('add to supply');
      await this.addToSupply(transactionOptions);
      logger.debug('apply is done');
    } catch (err) {
      logger.error({ err }, 'Failed to add TCB to blockchain');
    }
  }

  /**
   * Assign TCB from SuspiciousBlocks table to check
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public async assignSuspiciousBlocksToCheck(
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    await TxManager.execute(
      TCB.contract.methods.assignSuspiciousBlocksToCheck(this.tcbId),
      transactionOptions,
    );
  }

  /**
   * Assign TCB from LastBlocks table to check
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public async assignLastBlocksToCheck(transactionOptions?: TransactionOptions): Promise<void> {
    await TxManager.execute(
      TCB.contract.methods.assignLastBlocksToCheck(this.tcbId),
      transactionOptions,
    );
  }

  /**
   * Function stake and lock TCB's reward
   * @param tcbId - TEE Offer's completed and valid TCB contract
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public async claimRewards(transactionOptions?: TransactionOptions): Promise<void> {
    checkIfActionAccountInitialized();

    await TxManager.execute(TCB.contract.methods.claimRewards(this.tcbId), transactionOptions);
  }

  /**
   * Function unlock previously locked TCB rewards (by claimRewards)
   * @param tcbId - TCB contract address
   * @param unlockAmount - amount of tokens to unlock, max available amount = TeeOffer.getLockInfo(tcbAddress)
   * @param transactionOptions - object what contains alternative action account or gas limit (optional)
   */
  public async unlockRewards(transactionOptions?: TransactionOptions): Promise<void> {
    checkIfActionAccountInitialized();

    await TxManager.execute(TCB.contract.methods.unlockTcbReward(this.tcbId), transactionOptions);
  }

  /**
   * Function for fetching all TCB data
   */
  public async get(): Promise<TcbData> {
    const tcb: TcbData = cleanWeb3Data(await TCB.contract.methods.getTcbById(this.tcbId).call());

    return tcb;
  }

  /**
   * Function for fetching Public Data from TCB
   */
  public async getPublicData(): Promise<TcbPublicData> {
    const publicData = await Consensus.getTcbsPublicData([this.tcbId]);

    return publicData[this.tcbId];
  }

  /**
   * Function for fetching Public Data from TCB
   */
  public async getUtilityData(): Promise<TcbUtilityData> {
    const utilityData = await Consensus.getTcbsUtilityData([this.tcbId]);

    return utilityData[this.tcbId];
  }

  /**
   * Function for fetching TCB avaliable reward
   */
  public getRewardAmount(): Promise<bigint> {
    return TCB.contract.methods.getTcbReward(this.tcbId).call();
  }
}

export default TCB;
