import { HardwareInfo } from './HardwareInfo.js';

export type TeeOfferInfo = {
  name: string;
  description: string;
  teeType: string;
  properties: string;
  argsPublicKey: string;
  hardwareInfo: HardwareInfo;
};
