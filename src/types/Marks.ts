export enum Mark {
  None = '0',
  Positive = '1',
  Negative = '2',
}

export type ProviderMarksCount = {
  positive: bigint | string;
  negative: bigint | string;
};
