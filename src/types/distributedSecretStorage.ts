import { BlockchainId, TokenAmount } from './Web3.js';

export type LoaderSecretPublicKey = {
  secretPublicKey: string;
  signature: string;
  signedTime: number;
  timestamp: number;
};

export type LoaderSession = {
  publicSessionKey: string;
  signture: string;
  timestamp: number;
  signedTime: number;
};

export type NewLoaderSessionArgs = {
  teeOfferId: BlockchainId;
  keeperOfferId: BlockchainId;
  signedTime: number;
  publicSessionKey: string;
  signture: string;
};

export type SecretRequestObj = {
  secretRequestorId: BlockchainId;
  secretKeeperId: BlockchainId;
  offerId: BlockchainId;
  offerVersion?: number;
};

export type SecretRequest = {
  timestamp: number;
} & SecretRequestObj;

export type OfferResourceObj = {
  offerId: BlockchainId;
  teeOfferIssuerId: BlockchainId;
  teeOfferKeeperId: BlockchainId;
  storageOrderId: BlockchainId;
  offerVersion?: number;
  signedTime: number;
  signature: string;
  signedData: string;
};

export type OfferResource = {
  timestamp: number;
} & OfferResourceObj;

export type OfferStorageAllocated = {
  offerId: BlockchainId;
  teeOfferIssuerId: BlockchainId;
  storageOrderId: BlockchainId;
  offerVersion?: number;
  distributionRepliactionFactor: number;
  timestamp: number;
};

export type OfferStorageRequestObj = {
  offerId: BlockchainId;
  teeOfferIssuerId: BlockchainId;
  storageOfferId: BlockchainId;
  storageSlotId: BlockchainId;
  deposit: TokenAmount;
  offerVersion?: number;
  repliactionFactor: number;
};

export type OfferStorageRequest = {
  timestamp: number;
} & OfferStorageRequestObj;
