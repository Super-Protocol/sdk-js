import { CryptoAlgorithm, TeeOfferInfo } from '.';
import Crypto from './Crypto';
import Offer from './models/Offer';
import Order from './models/Order';
import TeeOffer from './models/TeeOffer';
import { OfferInfo } from './types/Offer';
import { OrderInfo } from './types/Order';

const tlbMock = {
    argsPublicKeyAlgo: 'RSA-Hybrid',
    argsPublicKey: '',
};

class TIIGenerator {
    public static async generate(url: string, args: any, solutionHashes: string[], encryptionKey: string, orderId: string): Promise<string> {
        const order: Order = new Order(orderId);
        const orderInfo: OrderInfo = await order.getOrderInfo();

        const offer: Offer = new Offer(orderInfo.offer);

        const parentOrderAddress: string = await order.getParentOrder();
        const parentOrder: Order = new Order(parentOrderAddress);
        const parentOrderInfo: OrderInfo = await parentOrder.getOrderInfo();

        const teeOffer: TeeOffer = new TeeOffer(parentOrderInfo.offer);
        const teeOfferInfo: TeeOfferInfo = await teeOffer.getInfo();
        
        // TODO: get real tlb from teeOffer
        // TODO: check env with SP-149

        const tri: TeeRunInfo = {
            solutionHashes,
            encryptionKey,
            args,
        };

        return JSON.stringify({
            url: await Crypto.encrypt(teeOfferInfo.argsPublicKeyAlgo as CryptoAlgorithm, url, teeOfferInfo.argsPublicKey),
            tri: await Crypto.encrypt(tlbMock.argsPublicKeyAlgo as CryptoAlgorithm, JSON.stringify(tri), tlbMock.argsPublicKey),
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
    encryptionKey: string;
    args: any;
};

export default TIIGenerator;