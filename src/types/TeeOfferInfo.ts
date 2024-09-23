import { HardwareInfo } from './HardwareInfo.js';
import { TeeOfferSubtype } from './Offer.js';

export type TeeOfferInfo = {
  name: string;
  description: string;
  teeType: string;
  subType: TeeOfferSubtype;
  properties: string;
  argsPublicKey: string;
  hardwareInfo: HardwareInfo;
};
