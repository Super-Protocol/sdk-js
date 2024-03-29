import { HardwareInfo } from './HardwareInfo';

export type TeeOfferInfo = {
  name: string;
  description: string;
  teeType: string;
  properties: string;
  tlb: string;
  argsPublicKey: string;
  hardwareInfo: HardwareInfo;
};
