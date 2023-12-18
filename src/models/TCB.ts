import { Contract, TransactionReceipt } from 'web3';
import { abi } from '../contracts/abi';
import TxManager from '../utils/TxManager';
import { BlockchainConnector } from '../connectors';
import {
  BlockchainId,
  TcbData,
  TcbPublicData,
  TcbVerifiedStatus,
  TransactionOptions,
} from '../types';
import {
  checkIfActionAccountInitialized,
  cleanWeb3Data,
  packDeviceId,
  unpackDeviceId,
} from '../utils/helper';

class TCB {
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

    const fromattedDeviceId = packDeviceId(publicData.deviceId);
    return TxManager.execute(
      TCB.contract.methods.setTcbData(
        this.tcbId,
        publicData.benchmark,
        publicData.properties,
        fromattedDeviceId,
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
  ): Promise<string[]> {
    const promises: Promise<TransactionReceipt>[] = [];
    promises.push(
      this.applyTcbMarks(publicData.checkingTcbMarks, transactionOptions),
      this.setTcbData(publicData, quote, publicKey, transactionOptions),
      this.addToSupply(transactionOptions),
    );

    return (await Promise.all(promises)).map((tx) => tx.transactionHash as string);
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
    const tcb: TcbData = await TCB.contract.methods.getTcbById(this.tcbId).call();

    return tcb;
  }

  /**
   * Function for fetching Public Data from TCB
   */
  public async getPublicData(): Promise<TcbPublicData> {
    const tcbsPublicData: TcbPublicData[] = await TCB.contract.methods
      .getTcbsPublicData([this.tcbId])
      .call()
      .then((array) => array.map((item) => cleanWeb3Data(item) as TcbPublicData));
    const publicData = tcbsPublicData[0];
    publicData.deviceId = unpackDeviceId(publicData.deviceId);
    publicData.checkingTcbIds = publicData.checkingTcbIds.map((id) => id.toString());

    return publicData;
  }

  /**
   * Function for fetching TCB avaliable reward
   */
  public getRewardAmount(): Promise<bigint> {
    return TCB.contract.methods.getTcbReward(this.tcbId).call();
  }
}

export default TCB;
