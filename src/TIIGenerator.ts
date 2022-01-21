import { TLBlockDeserializeResultType, TLBlockSerializerV1 } from "@super-protocol/tee-lib";

import { Offer, OfferInfo, TeeOfferInfo } from ".";
import Crypto from "./crypto";
import Order from "./models/Order";
import TeeOffer from "./models/TeeOffer";
import { OrderInfo } from "./types/Order";
import { CryptoAlgorithm, Encryption, Resource, UrlResource } from "@super-protocol/sp-dto-js";

class TIIGenerator {
    public static async generateByOffer(
        offerId: string,
        solutionHashes: SolutionHash[],
        resource: Resource,
        args: any,
        encryption: Encryption
    ): Promise<string> {
        const teeOffer: TeeOffer = new TeeOffer(offerId);
        const teeOfferInfo: TeeOfferInfo = await teeOffer.getInfo();

        // TODO: get real tlb
        const tlb: TLBlockDeserializeResultType =
            new TLBlockSerializerV1().deserializeTlb(
                Buffer.from(teeOfferInfo.tlb, "base64")
            );

        // TODO: check env with SP-149

        const tri: TeeRunInfo = {
            solutionHashes,
            args,
            encryption: encryption,
        };

        return JSON.stringify({
            encryptedResource: await Crypto.encrypt(
                teeOfferInfo.argsPublicKeyAlgo as CryptoAlgorithm,
                JSON.stringify(resource),
                teeOfferInfo.argsPublicKey
            ),
            tri: await Crypto.encrypt(
                CryptoAlgorithm.ECIES,
                JSON.stringify(tri),
                tlb.data.teePubKeyData.toString("base64")
            ),
        });
    }

    public static async generate(
        orderId: string,
        resource: Resource,
        args: any,
        encryption: Encryption
    ): Promise<string> {
        const order: Order = new Order(orderId);

        const parentOrderAddress: string = await order.getParentOrder();
        const parentOrder: Order = new Order(parentOrderAddress);
        const parentOrderInfo: OrderInfo = await parentOrder.getOrderInfo();

        const solutionHashes: SolutionHash[] = [];
        await Promise.all(
            parentOrderInfo.args.inputOffers.map(
                async (offerAddress: string): Promise<void> => {
                    const offer: Offer = new Offer(offerAddress);
                    const offerInfo: OfferInfo = await offer.getInfo();
                    if (offerInfo.hash && offerInfo.hashAlgo) {
                        solutionHashes.push({
                            hash: offerInfo.hash,
                            hashAlgo: offerInfo.hashAlgo,
                        });
                    }
                }
            )
        );

        return this.generateByOffer(
            parentOrderInfo.offer,
            solutionHashes,
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

export type SolutionHash = {
    hash: string;
    hashAlgo: string;
};

export type TeeRunInfo = {
    solutionHashes: SolutionHash[];
    args: any;
    encryption: Encryption;
};

export default TIIGenerator;
