import { Encryption, CryptoAlgorithm, Encoding, Hash } from '@super-protocol/dto-js';
import { TLBlockSerializerV1, TLBlockUnserializeResultType } from '@super-protocol/tee-lib';
import { TeeOffer, TCB, Offer } from './models/index.js';
import { BlockchainId, OfferInfo, OfferType, TeeOfferInfo } from './types/index.js';
import Crypto from './crypto/index.js';
import { TeeBlockVerifier } from './tee/TeeBlockVerifier.js';
import { ZERO_HASH } from './constants.js';

export default class TeeInputGeneratorBase {
  public static async getOffersHashesAndLinkage(inputOffers: BlockchainId[]): Promise<{
    solutionHashes: Hash[];
    imageHashes: Hash[];
    dataHashes: Hash[];
    linkage?: string;
  }> {
    const solutionHashes: Hash[] = [];
    const dataHashes: Hash[] = [];
    const imageHashes: Hash[] = [];
    let solutionLinkage: string | undefined;
    let anyLinkage: string | undefined;

    await Promise.all(
      inputOffers.map(async (offerId): Promise<void> => {
        const offer: Offer = new Offer(offerId);
        const offerInfo: OfferInfo = await offer.getInfo();

        if (offerInfo.offerType === OfferType.Solution) {
          const isBaseImage = await offer.isBaseImage();
          const isPublic = await offer.isOfferPublic();

          if (!isBaseImage) {
            solutionLinkage = offerInfo.linkage;
            solutionHashes.push(offerInfo.hash ? JSON.parse(offerInfo.hash) : ZERO_HASH);
          } else if (!isPublic) {
            anyLinkage = offerInfo.linkage;
            imageHashes.push(offerInfo.hash ? JSON.parse(offerInfo.hash) : ZERO_HASH);
          }
        }

        if (offerInfo.offerType === OfferType.Data) {
          dataHashes.push(offerInfo.hash ? JSON.parse(offerInfo.hash) : ZERO_HASH);
        }
      }),
    );

    return {
      solutionHashes,
      dataHashes,
      imageHashes,
      linkage: solutionLinkage || anyLinkage,
    };
  }

  public static async encryptByTeeBlock(
    offerId: string,
    data: string,
    sgxApiUrl: string,
  ): Promise<Encryption> {
    const encryption = await this.getVerifiedBlockEncryption(offerId, sgxApiUrl);

    const encryptedInfo = await Crypto.encrypt(data, encryption);

    return encryptedInfo;
  }

  protected static async getVerifiedBlockEncryption(
    offerId: string,
    sgxApiUrl: string,
  ): Promise<Encryption> {
    const teeOffer: TeeOffer = new TeeOffer(offerId);
    const teeOfferInfo: TeeOfferInfo = await teeOffer.getInfo();
    const tcbId = await teeOffer.getActualTcbId();
    const verifyByTcb = Number.parseInt(tcbId) != 0;

    let encryption: Encryption;

    if (verifyByTcb) {
      const tcb = new TCB(await teeOffer.getActualTcbId());
      const { pubKey, quote } = await tcb.getUtilityData();
      await TeeBlockVerifier.verifyTcb(tcb, quote, pubKey, sgxApiUrl);

      // TODO: must be 'blockEncryption = JSON.parse(pubKey);'
      encryption = {
        algo: CryptoAlgorithm.ECIES,
        key: pubKey,
        encoding: Encoding.base64,
      };
    } else {
      const serializer = new TLBlockSerializerV1();
      const tlb: TLBlockUnserializeResultType = serializer.unserializeTlb(
        Buffer.from(teeOfferInfo.tlb, 'base64'),
      );

      await TeeBlockVerifier.verifyTlb(tlb, teeOfferInfo.tlb, offerId, sgxApiUrl);

      encryption = {
        algo: CryptoAlgorithm.ECIES,
        key: tlb.data.teePubKeyData.toString('base64'),
        encoding: Encoding.base64,
      };
    }

    return encryption;
  }
}
