import { BlockchainId, TokenAmount } from './Web3.js';

export type LoaderSecretPublicKey = {
  secretPublicKey: string;
  signature: string;
  signedTime: number;
  timestamp?: number;
};

export type LoaderSession = {
  sessionPublicKey: string;
  signature: string;
  timestamp?: number;
  signedTime: number;
};

export type SecretRequest = {
  secretRequestorId: BlockchainId;
  secretKeeperId: BlockchainId;
  offerId: BlockchainId;
  offerVersion?: number;
  timestamp?: number;
};

export type OfferResource = {
  offerId: BlockchainId;
  teeOfferIssuerId: BlockchainId;
  teeOfferKeeperId: BlockchainId;
  storageOrderId: BlockchainId;
  offerVersion?: number;
  signedTime: number;
  timestamp?: number;
  signature: string;
  signedData: string;
};

export type OfferStorageAllocated = {
  teeOfferIssuerId: BlockchainId;
  storageOrderId: BlockchainId;
  distributionreplicationFactor: number;
  timestamp: number;
};

export type OfferStorageRequest = {
  offerId: BlockchainId;
  teeOfferIssuerId: BlockchainId;
  storageOfferId: BlockchainId;
  storageSlotId: BlockchainId;
  deposit: TokenAmount;
  offerVersion?: number;
  replicationFactor: number;
  timestamp?: number;
};
