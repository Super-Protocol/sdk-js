export enum OfferVersionStatus {
  New = '0',
  Deleted = '1',
}

export type OfferVersionInfo = {
  mrenclave: string;
  mrsigner: string;
};

export type OfferVersion = {
  version: number;
  info: OfferVersionInfo;
  status: OfferVersionStatus;
};
