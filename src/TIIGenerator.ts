import { TLBlockDeserializeResultType, TLBlockSerializerV1 } from "@super-protocol/tee-lib";
import { readFileSync } from "fs";

import { TeeOfferInfo } from ".";
import Crypto, { CryptoAlgorithm } from "./Crypto";
import Order from "./models/Order";
import TeeOffer from "./models/TeeOffer";
import { OrderInfo } from "./types/Order";

// TODO: make it async
let tlbMock: Buffer | undefined;
try {
    tlbMock = Buffer.from(readFileSync(__dirname + "/__mocks__/tlb.b64").toString(), "base64");
} catch (e) {}

class TIIGenerator {
    public static async generate(
        orderId: string,
        url: string,
        solutionHashes: string[],
        args: any,
        encryptionKey: string,
        encryptionKeyAlgo: string
    ): Promise<string> {
        const order: Order = new Order(orderId);

        const parentOrderAddress: string = await order.getParentOrder();
        const parentOrder: Order = new Order(parentOrderAddress);
        const parentOrderInfo: OrderInfo = await parentOrder.getOrderInfo();

        const teeOffer: TeeOffer = new TeeOffer(parentOrderInfo.offer);
        const teeOfferInfo: TeeOfferInfo = await teeOffer.getInfo();

        // TODO: get real tlb
        if (!tlbMock) throw new Error("TLB not found");
        const tlb: TLBlockDeserializeResultType = new TLBlockSerializerV1().deserializeTlb(tlbMock);

        // TODO: uncomment when offerInfo.hash is ready
        // const solutionHashes: string[] = await Promise.all(parentOrderInfo.args.inputOffers.map(async (offerAddress: string) => {
        //     const offer: Offer = new Offer(offerAddress);
        //     const offerInfo: OfferInfo = await offer.getInfo();
        //     return offerInfo.hash;
        // }));

        // TODO: check env with SP-149

        const tri: TeeRunInfo = {
            solutionHashes,
            args,
            encryptionKey,
            encryptionKeyAlgo,
        };

        return JSON.stringify({
            url: await Crypto.encrypt(
                teeOfferInfo.argsPublicKeyAlgo as CryptoAlgorithm,
                url,
                teeOfferInfo.argsPublicKey
            ),
            tri: await Crypto.encrypt("ECIES", JSON.stringify(tri), tlb.data.teePubKeyData.toString("hex")),
        });
    }

    public static async getTRI(tii: string, encryptionKey: string, algo: CryptoAlgorithm): Promise<TeeRunInfo> {
        const tiiObj = JSON.parse(tii);
        const tri: string = await Crypto.decrypt(algo, tiiObj.tri, encryptionKey);
        return <TeeRunInfo>JSON.parse(tri);
    }

    public static async getUrl(tii: string, encryptionKey: string, algo: CryptoAlgorithm): Promise<string> {
        const tiiObj = JSON.parse(tii);
        const url: string = await Crypto.decrypt(algo, tiiObj.url, encryptionKey);
        return url;
    }
}

export type TeeRunInfo = {
    solutionHashes: string[];
    args: any;
    encryptionKey: string;
    encryptionKeyAlgo: string;
};

export default TIIGenerator;
