import { TLBlockDeserializeResultType, TLBlockSerializerV1 } from "@super-protocol/tee-lib";

import { Offer, OfferInfo, TeeOfferInfo } from ".";
import Crypto from "./crypto";
import Order from "./models/Order";
import TeeOffer from "./models/TeeOffer";
import { OrderInfo } from "./types/Order";
import { CryptoAlgorithm, Encryption, Resource, UrlResource } from "@super-protocol/sp-dto-js";

const tlbMock: Buffer = Buffer.from(
    "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",
    "base64"
);

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
            new TLBlockSerializerV1().deserializeTlb(tlbMock);

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
