import { BlockchainId, TokenAmount } from './Web3.js';

export type PublicKey = {
  kty: string;
  crv: string;
  pointX: Uint8Array; // bytes32
  pointY: Uint8Array; // bytes32
};

export type Signature = {
  der: string;
  r: Uint8Array; // bytes32
  s: Uint8Array; // bytes32
  v: number;
};

export type LoaderSecretPublicKey = {
  secretPublicKey: PublicKey;
  signature: Signature;
  signedTime: number;
  timestamp: number;
};

export type LoaderSession = {
  sessionPublicKey: PublicKey;
  signature: string;
  timestamp: number;
  signedTime: number;
};

export type SecretRequest = {
  secretRequestorId: BlockchainId;
  secretKeeperId: BlockchainId;
  offerId: BlockchainId;
  offerVersion?: number;
  timestamp: number;
};

export type OfferResource = {
  offerId: BlockchainId;
  teeOfferIssuerId: BlockchainId;
  teeOfferKeeperId: BlockchainId;
  storageOrderId: BlockchainId;
  offerVersion?: number;
  signedTime: number;
  timestamp: number;
  signature: Signature;
  signedEncryptedData: string;
};

export type OfferStorageAllocated = {
  teeOfferIssuerId: BlockchainId;
  storageOrderId: BlockchainId;
  distributionReplicationFactor: number;
  timestamp: number;
};

export type OfferStorageRequest = {
  offerId: BlockchainId;
  teeOfferIssuerId: BlockchainId;
  storageOfferId: BlockchainId;
  storageSlotId: BlockchainId;
  deposit: TokenAmount;
  orderId: BlockchainId;
  offerVersion?: number;
  replicationFactor: number;
  timestamp: number;
};
