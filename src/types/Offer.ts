import { BlockchainId } from '../types/index.js';

export enum OfferType {
  TeeOffer = '0',
  Storage = '1',
  Solution = '2',
  Data = '3',
}

export enum TeeOfferSubtype {
  Default = '0',
  TeeSubtypeSGX = '1',
  TeeSubtypeTDX = '2',
  TeeSubtypeSEV = '3',
  TeeSubtypeARM = '4',
}

export enum ValueOfferSubtype {
  Default = '0',
  ValueSubtypeEngine = '1',
  ValueSubtypeModel = '2',
  ValueSubtypeDataset = '3',
}

export enum OfferGroup {
  Input = '0',
  Processing = '1',
  Output = '2',
}

export type ValueOfferRestrictionsSpecification = {
  offers: BlockchainId[];
  types: OfferType[];
  versions: number[];
};

type OfferInfoBase = {
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
  hash: string;
  signatureKey: string;
  metadata: string;
  subType: ValueOfferSubtype;
};

export type OfferInfoRaw = OfferInfoBase & {
  linkage_DEPRECATED: string;
};

export type OfferInfo = OfferInfoBase & {
  linkage: string; // TODO remove after signatureKey supported
  restrictions: ValueOfferRestrictionsSpecification;
};
