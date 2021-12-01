import { CryptoAlgorithm, TeeOfferInfo } from '.';
import Crypto from './Crypto';
import Order from './models/Order';
import TeeOffer from './models/TeeOffer';
import { OrderInfo } from './types/Order';

const tlbMock = {
    argsPublicKeyAlgo: 'RSA-Hybrid',
    argsPublicKey: `-----BEGIN PUBLIC KEY-----
MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgG0Bpb0BMgdCnKvuAJKB9qGDwXok
ta0sGrExwQFMTmW48r2hM28YSWkyJ+tLiF+4K44vO8p0z93IOjauBflvGhrf2jOk
cN9k8eGLMcfOAw5v9/ajo53ZtQtTRaai0UyL6r9Qys1hXBmUeH8I5DawqUuxiSnN
de/ESZiSbtIiaUWbAgMBAAE=
-----END PUBLIC KEY-----`,
};

class TIIGenerator {
    public static async generate(orderId: string, url: string, solutionHashes: string[], args: any, encryptionKey: string,  encryptionKeyAlgo: string): Promise<string> {
        const order: Order = new Order(orderId);

        const parentOrderAddress: string = await order.getParentOrder();
        const parentOrder: Order = new Order(parentOrderAddress);
        const parentOrderInfo: OrderInfo = await parentOrder.getOrderInfo();

        const teeOffer: TeeOffer = new TeeOffer(parentOrderInfo.offer);
        const teeOfferInfo: TeeOfferInfo = await teeOffer.getInfo();
        
        // TODO: get real tlb from teeOffer
        // TODO: check env with SP-149

        const tri: TeeRunInfo = {
            solutionHashes,
            args,
            encryptionKey,
            encryptionKeyAlgo,
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
    args: any;
    encryptionKey: string;
    encryptionKeyAlgo: string;
};

export default TIIGenerator;