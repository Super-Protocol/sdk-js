import { TLBlockSerializerV1, TLBlockUnserializeResultType } from "@super-protocol/tee-lib";
import _ from 'lodash';

import { Offer, OfferInfo, TeeOfferInfo } from ".";
import Crypto from "./crypto";
import Order from "./models/Order";
import TeeOffer from "./models/TeeOffer";
import { OrderInfo } from "./types/Order";
import {
    CryptoAlgorithm,
    Encoding,
    Encryption,
    Resource,
    UrlResource,
    Hash,
    Linkage
} from "@super-protocol/sp-dto-js";

class TIIGenerator {
    public static async generateByOffer(
        offerId: string,
        solutionHashes: Hash[],
        linkageString: string|undefined,
        resource: Resource,
        args: any,
        encryption: Encryption
    ): Promise<string> {
        const teeOffer: TeeOffer = new TeeOffer(offerId);
        const teeOfferInfo: TeeOfferInfo = await teeOffer.getInfo();

        const linkage: Linkage = linkageString ? JSON.parse(linkageString) : {
            encoding: Encoding.base64,
            mrenclave: '',
        };

        // TODO: get real tlb
        const tlb: TLBlockUnserializeResultType =
            new TLBlockSerializerV1().unserializeTlb(
                Buffer.from(teeOfferInfo.tlb, "base64")
            );

        // TODO: check env with SP-149

        const tri: TeeRunInfo = {
            solutionHashes,
            linkage,
            args,
            encryption: encryption,
        };

        return JSON.stringify({
            encryptedResource: await Crypto.encrypt(
                JSON.stringify(resource),
                JSON.parse(teeOfferInfo.argsPublicKey) as Encryption,
            ),
            tri: await Crypto.encrypt(
                JSON.stringify(tri),
                {
                    algo: CryptoAlgorithm.ECIES,
                    key: tlb.data.teePubKeyData.toString("base64"),
                    encoding: Encoding.base64,
                },
            ),
        });
    }

    public static async generate(
        orderId: number,
        resource: Resource,
        args: any,
        encryption: Encryption
    ): Promise<string> {
        const order: Order = new Order(orderId);

        const parentOrderAddress: string = await order.getParentOrder();
        const parentOrder: Order = new Order(+parentOrderAddress);
        const parentOrderInfo: OrderInfo = await parentOrder.getOrderInfo();

        const solutionHashes: Hash[] = [];
        let solutionLinkage: string|undefined;
        let anyLinkage: string|undefined;
        await Promise.all(
            parentOrderInfo.args.inputOffers.map(
                async (offerAddress: string): Promise<void> => {
                    const offer: Offer = new Offer(offerAddress);
                    const offerInfo: OfferInfo = await offer.getInfo();

                    if (offerInfo.hash) {
                        solutionHashes.push(JSON.parse(offerInfo.hash));
                    }

                    const restrictions = _
                        .intersection(offerInfo.restrictions.offers, parentOrderInfo.args.inputOffers)
                        .filter(restrictedOfferAddress => restrictedOfferAddress !== offer.address);
                    if (restrictions.length) {
                        solutionLinkage = offerInfo.linkage;
                    } else {
                        anyLinkage = offerInfo.linkage;
                    }
                }
            )
        );

        return this.generateByOffer(
            parentOrderInfo.offer,
            solutionHashes,
            solutionLinkage || anyLinkage,
            resource,
            args,
            encryption
        );
    }

    public static async getTRI(tii: string, decryptionKey: Buffer): Promise<TeeRunInfo> {
        const tiiObj = JSON.parse(tii);
        tiiObj.tri.key = decryptionKey.toString(tiiObj.tri.encoding);
        const tri: string = await Crypto.decrypt(tiiObj.tri as Encryption);
        return <TeeRunInfo>JSON.parse(tri);
    }

    public static async getUrl(tii: string, decryptionKey: Buffer): Promise<string> {
        const res = await TIIGenerator.getResource<UrlResource>(tii, decryptionKey);
        return res.url;
    }

    public static async getResource<T>(tii: string, decryptionKey: Buffer): Promise<T> {
        const encryptedResource = JSON.parse(tii).encryptedResource as Encryption;
        encryptedResource.key = decryptionKey.toString(encryptedResource.encoding);
        const resource: string = await Crypto.decrypt(encryptedResource);
        return JSON.parse(resource) as T;
    }
}

export type TeeRunInfo = {
    solutionHashes: Hash[];
    linkage: Linkage;
    args: any;
    encryption: Encryption;
};

export default TIIGenerator;
