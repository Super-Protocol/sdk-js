import Crypto from './Crypto';
import Offer from './models/Offer';
import Order from './models/Order';
import TeeOffer from './models/TeeOffer';
import { OfferInfo } from './types/Offer';
import { OrderInfo } from './types/Order';

class TIIGenerator {
    public static async generate(url: string, args: any, encryptionKey: string, orderId: string): Promise<string> {
        const order: Order = new Order(orderId);
        const orderInfo: OrderInfo = await order.getOrderInfo();

        const offer: Offer = new Offer(orderInfo.offer);
        const offerInfo: OfferInfo = await offer.getInfo();

        const parentOrderAddress: string = await order.getParentOrder();
        const parentOrder: Order = new Order(parentOrderAddress);
        const parentOrderInfo: OrderInfo = await parentOrder.getOrderInfo();

        const teeOffer: TeeOffer = new TeeOffer(parentOrderInfo.offer);
        // TODO: get real tlb from teeOffer

        // TODO: check env with SP-149

        const tri: TeeRunInfo = {
            key: offerInfo.argsPublicKey,
            algo: offerInfo.argsPublicKeyAlgo,
            tlb: {},
        };

        return JSON.stringify({
            url: await Crypto.encrypt('RSA-Hybrid', url, encryptionKey),
            tri: await Crypto.encrypt('RSA-Hybrid', JSON.stringify(tri), encryptionKey),
        });
    }

    public static async getTRI(tii: string, encryptionKey: string): Promise<TeeRunInfo> {
        const tiiObj = JSON.parse(tii);
        const tri: string = await Crypto.decrypt('RSA-Hybrid', tiiObj.tri, encryptionKey);
        return <TeeRunInfo>JSON.parse(tri);
    }

    public static async getUrl(tii: string, encryptionKey: string): Promise<string> {
        const tiiObj = JSON.parse(tii);
        const url: string = await Crypto.decrypt('RSA-Hybrid', tiiObj.url, encryptionKey);
        return url;
    }
}

export type TeeRunInfo = {
    key: string;
    algo: string;
    tlb: any;
};

export default TIIGenerator;