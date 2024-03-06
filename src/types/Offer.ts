import { BlockchainId } from './Web3.js';

export enum OfferType {
  TeeOffer = '0',
  Storage = '1',
  Solution = '2',
  Data = '3',
}

export enum OfferGroup {
  Input = '0',
  Processing = '1',
  Output = '2',
}

export type OfferRestrictions = {
  offers: BlockchainId[];
  types: OfferType[];
};

export type OfferInfo = {
  name: string;
  group: OfferGroup;
  offerType: OfferType;
  cancelable: boolean;
  description: string;
  input: string;
  output: string;
  allowedArgs: string;
  allowedAccounts: string[];
  argsPublicKey: string;
  resultResource: string;
  linkage: string;
  hash: string;
  metadata: string;
  restrictions: OfferRestrictions;
};
