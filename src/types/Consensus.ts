import { BlockchainId, TokenAmount } from './Web3';

export enum TcbVerifiedStatus {
  Valid = 0,
  InvalidQuote = 1,
  InvalidMrEnclave = 2,
  InvalidBcbHash = 3,
}

export type TcbPublicData = {
  teeOffer?: BlockchainId;
  deviceID: string;
  benchmark: number;
  properties: string;
};

export type TcbUtilityData = {
  checkingBlocks: [BlockchainId];
  checkingBlockMarks: [TcbVerifiedStatus];
  lastBlocksTakenAmount: number;
  suspiciousBlocksTakenAmount: number;
  negative: number;
  positive: number;
  previousTcb: BlockchainId;
  lastBlocksTaken: boolean;
  suspiciousBlocksTaken: boolean;
  assignedToEpoch: boolean;
  checked: boolean;
  rewardClaimed: boolean;
};

export type Epoch = {
  reward: string;
  benchmark: number;
  penaltyBenchmark: number;
};

export enum TcbStatus {
  Inited = '0',
  Completed = '1',
  Banned = '2',
  BenchmarkChanged = '3',
}

export type TcbData = {
  quote: string;
  timeInitialized: number;
  timeAdded: number;
  publicData: TcbPublicData;
  utilData: TcbUtilityData;
  status: TcbStatus;
};

export type EpochInfo = {
  reward: TokenAmount;
  benchmark: bigint | string;
  penaltyBenchmark: bigint | string;
};

export type ConsensusConstants = {
  CONSENSUS_L1: number;
  CONSENSUS_L2: number;
  CONSENSUS_K: number;
  CONSENSUS_MAX_PENALTIES: number;
  MAX_BECHMARK_OVERRUN_PERCENT: number;
  CONSENSUS_EPOCH_DURATION: number;
};

export const ConsensusConstantsStructure = {
  CONSENSUS_L1: Number,
  CONSENSUS_L2: Number,
  CONSENSUS_K: Number,
  CONSENSUS_MAX_PENALTIES: Number,
  MAX_BECHMARK_OVERRUN_PERCENT: Number,
  CONSENSUS_EPOCH_DURATION: Number,
};
