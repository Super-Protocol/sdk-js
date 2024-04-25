import rootLogger from '../logger.js';
import TCB from '../models/TCB.js';
import Superpro from './Superpro.js';
import {
  EpochInfo,
  ConsensusConstants,
  TransactionOptions,
  BlockInfo,
  BlockchainId,
  TokenAmount,
  TcbPublicData,
  TcbUtilityData,
} from '../types/index.js';
import {
  checkIfActionAccountInitialized,
  cleanWeb3Data,
  formatTcbPublicData,
  transformComplexObject,
  unpackDeviceId,
} from '../utils/helper.js';
import TxManager from '../utils/TxManager.js';
import { BlockchainConnector, BlockchainEventsListener } from '../connectors/index.js';
import { EventLog } from 'web3-eth-contract';
import { TcbVerifiedStatus } from '@super-protocol/dto-js';
import {
  WssSubscriptionOnDataFn,
  WssSubscriptionOnErrorFn,
} from '../connectors/BlockchainEventsListener.js';

class Consensus {
  private static readonly logger = rootLogger.child({ className: 'Consensus' });
  private static tcbIds?: BlockchainId[];

  public static get address(): string {
    return Superpro.address;
  }

  /**
   * Function for fetching list of all tcb ids
   * @returns list of tcb ids
   */
  public static async getAllTcbs(): Promise<BlockchainId[]> {
    const contract = BlockchainConnector.getInstance().getContract();
    const tcbSet = new Set(this.tcbIds ?? []);

    const tcbsCount = Number(await contract.methods.getTcbsCount().call());
    for (let tcbId = tcbSet.size + 1; tcbId <= tcbsCount; tcbId++) {
      tcbSet.add(tcbId.toString());
    }
    this.tcbIds = Array.from(tcbSet);

    return this.tcbIds;
  }

  public static async getEpochTime(
    time: number,
  ): Promise<{ epochStart: number; epochEnd: number; epochIndex: number }> {
    const contract = BlockchainConnector.getInstance().getContract();
    const response = await contract.methods.getEpochTime(time).call();

    return {
      epochStart: Number(response[0]),
      epochEnd: Number(response[1]),
      epochIndex: Number(response[2]),
    };
  }

  public static getEpoch(epochIndex: number): Promise<EpochInfo> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods
      .getEpoch(epochIndex)
      .call()
      .then((epoch) => cleanWeb3Data(epoch) as EpochInfo);
  }

  public static getSuspiciousBlockTable(): Promise<string[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods.getSuspiciousBlockTable().call();
  }

  public static async getTcbsPublicData(
    tcbIds: BlockchainId[],
  ): Promise<{ [tcbId: BlockchainId]: TcbPublicData }> {
    const contract = BlockchainConnector.getInstance().getContract();

    const response: { [tcbId: BlockchainId]: TcbPublicData } = {};
    const tcbsPublicData: TcbPublicData[] = await contract.methods
      .getTcbsPublicData(tcbIds)
      .call()
      .then((array) => formatTcbPublicData(array));

    for (let tcbIndex = 0; tcbIndex < tcbsPublicData.length; tcbIndex++) {
      tcbsPublicData[tcbIndex].deviceId = unpackDeviceId(tcbsPublicData[tcbIndex].deviceId);
      tcbsPublicData[tcbIndex].checkingTcbIds =
        tcbsPublicData[tcbIndex].checkingTcbIds?.map((id) => id.toString()) || [];
      tcbsPublicData[tcbIndex].checkingTcbMarks =
        tcbsPublicData[tcbIndex].checkingTcbMarks?.map(
          (mark) => Number(mark) as TcbVerifiedStatus,
        ) || [];
      tcbsPublicData[tcbIndex].benchmark = Number(tcbsPublicData[tcbIndex].benchmark);
      response[tcbIds[tcbIndex]] = tcbsPublicData[tcbIndex];
    }

    return response;
  }

  public static async getTcbsUtilityData(
    tcbIds: BlockchainId[],
  ): Promise<{ [tcbId: BlockchainId]: TcbUtilityData }> {
    const contract = BlockchainConnector.getInstance().getContract();

    const response: { [tcbId: BlockchainId]: TcbUtilityData } = {};
    const tcbUtilityData: TcbUtilityData[] = await contract.methods
      .getTcbsUtilityData(tcbIds)
      .call()
      .then((array) => array.map((item) => transformComplexObject(item) as TcbUtilityData));
    for (let tcbIndex = 0; tcbIndex < tcbUtilityData.length; tcbIndex++) {
      response[tcbIds[tcbIndex]] = tcbUtilityData[tcbIndex];
    }

    return response;
  }

  public static async unlockProfitByTcbList(
    tcbIds: BlockchainId[],
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    let executedCount: number;
    try {
      executedCount = Number(
        (await TxManager.dryRun(
          contract.methods.unlockTcbRewardByList(tcbIds),
          transactionOptions,
        )) as string,
      );
    } catch (e) {
      executedCount = 0;
    }

    if (executedCount === tcbIds.length) {
      await TxManager.execute(contract.methods.unlockTcbRewardByList(tcbIds), transactionOptions);
    } else {
      for (const tcbId of tcbIds) {
        await new TCB(tcbId).unlockRewards();
      }
    }
  }

  public static getSuspiciousBlockTableSize(): Promise<string> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods
      .getSuspiciousBlockTableSize()
      .call()
      .then((size) => size.toString());
  }

  public static getLastBlockTable(): Promise<BlockchainId[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods
      .getLastBlockTable()
      .call()
      .then((ids) => ids.map((id) => id.toString()));
  }

  public static getLastBlockTableSize(): Promise<string> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods
      .getLastBlockTableSize()
      .call()
      .then((size) => size.toString());
  }

  public static async getConstants(): Promise<ConsensusConstants> {
    const contract = BlockchainConnector.getInstance().getContract();
    const response: ConsensusConstants = await contract.methods.getConsensusConstants().call();

    return response;
  }

  public static onTcbBanned(callback: onTcbBannedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onTcbBanned' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <string>parsedEvent.tcbId,
        <string>parsedEvent.provider,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'TcbBanned',
    });
  }

  public static onTcbCompleted(callback: onTcbCompletedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onTcbCompleted' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <string>parsedEvent.tcbId,
        <string>parsedEvent.provider,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'TcbCompleted',
    });
  }

  public static onTcbInitialized(callback: onTcbInitializedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onTcbInitialized' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <string>parsedEvent.tcbId,
        <string>parsedEvent.provider,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'TcbInitialized',
    });
  }

  public static onTcbBenchmarkChanged(callback: onTcbBenchmarkChangedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onTcbBenchmarkChanged' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog) => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <string>parsedEvent.tcbId,
        <string>parsedEvent.provider,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'TcbBenchmarkChanged',
    });
  }

  public static onRewardsClaimed(callback: onRewardsClaimedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onRewardsClaimed' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog) => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <BlockchainId>parsedEvent.tcbId,
        <TokenAmount>parsedEvent.amount,
        <string>parsedEvent.claimer,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'RewardsClaimed',
    });
  }

  public static onTcbRewardUnlocked(callback: onTcbRewardUnlockedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onTcbRewardUnlocked' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog) => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <BlockchainId>parsedEvent.tcbId,
        <TokenAmount>parsedEvent.rewards,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'TcbRewardUnlocked',
    });
  }
}

export type onRewardsClaimedCallback = (
  tcbId: BlockchainId,
  amount: TokenAmount,
  claimer: string,
  block?: BlockInfo,
) => void;
export type onTcbRewardUnlockedCallback = (
  tcbId: BlockchainId,
  rewards: TokenAmount,
  block?: BlockInfo,
) => void;
export type onTcbBenchmarkChangedCallback = (
  tcbId: BlockchainId,
  provider: string,
  block?: BlockInfo,
) => void;
export type onTcbInitializedCallback = (
  tcbId: BlockchainId,
  provider: string,
  block?: BlockInfo,
) => void;
export type onTcbCompletedCallback = (
  tcbId: BlockchainId,
  provider: string,
  block?: BlockInfo,
) => void;
export type onTcbBannedCallback = (
  tcbId: BlockchainId,
  provider: string,
  block?: BlockInfo,
) => void;
export default Consensus;
