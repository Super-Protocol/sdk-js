import {gzip, ungzip} from "node-gzip";
import _ from 'lodash';

import { Compression, Compression_TYPE } from './proto/Compression';
import { TRI } from './proto/TRI';
import Crypto from "./crypto";
import Offer from "./models/Offer";
import Order from "./models/Order";
import TeeOffer from "./models/TeeOffer";
import { OrderInfo } from "./types/Order";
import { OfferInfo } from "./types/Offer";
import {
    CryptoAlgorithm,
    Encoding,
    Encryption,
    EncryptionWithMacIV,
    Hash,
    Linkage,
    Resource,
    UrlResource,
} from "@super-protocol/dto-js";
import { TLBlockSerializerV1, TLBlockUnserializeResultType } from "@super-protocol/tee-lib";
import { TeeOfferInfo } from "./types/TeeOffer";

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
        const mac = (encryption as any).authTag || (encryption as EncryptionWithMacIV).mac;
        const rawTri = {
            solutionHashes: solutionHashes.map((hash) => ({
                type: hash.algo,
                hash: Buffer.from(hash.hash, hash.encoding),
            })),
            mrenclave: Buffer.from(linkage.mrenclave, linkage.encoding),
            args: JSON.stringify(args || ''),
            encryption: {
                ...encryption,
                ciphertext: encryption.ciphertext ? Buffer.from(encryption.ciphertext, encryption.encoding) : undefined,
                key: encryption.key ? Buffer.from(encryption.key, encryption.encoding) : undefined,
                iv: (encryption as EncryptionWithMacIV).iv ? Buffer.from((encryption as EncryptionWithMacIV).iv, encryption.encoding) : undefined,
                mac: mac ? Buffer.from(mac, encryption.encoding) : undefined,
            },
        };
        const tri = TRI.encode(rawTri).finish();

        const compressedTri = Compression.encode({
            data: await gzip(tri),
            type: Compression_TYPE.GZIP,
        }).finish();

        return JSON.stringify({
            encryptedResource: await Crypto.encrypt(
                JSON.stringify(resource),
                JSON.parse(teeOfferInfo.argsPublicKey) as Encryption,
            ),
            tri: await Crypto.encrypt(
                Buffer.from(compressedTri).toString(Encoding.base64),
                {
                    algo: CryptoAlgorithm.ECIES,
                    key: Buffer.from(tlb.data.teePubKeyData).toString("base64"),
                    encoding: Encoding.base64,
                },
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

        const { hashes, linkage } = await this.getSolutionHashesAndLinkage(parentOrderInfo.args.inputOffers);

        return this.generateByOffer(
            parentOrderInfo.offer,
            hashes,
            linkage,
            resource,
            args,
            encryption
        );
    }

    public static async getSolutionHashesAndLinkage(inputOffers: string[]): Promise<{ hashes: Hash[], linkage?: string }> {
        const solutionHashes: Hash[] = [];
        let solutionLinkage: string|undefined;
        let anyLinkage: string|undefined;
        await Promise.all(
            inputOffers.map(
                async (offerAddress: string): Promise<void> => {
                    const offer: Offer = new Offer(offerAddress);
                    const offerInfo: OfferInfo = await offer.getInfo();

                    if (offerInfo.hash) {
                        solutionHashes.push(JSON.parse(offerInfo.hash));
                    }

                    const restrictions = _
                        .intersection(offerInfo.restrictions.offers, inputOffers)
                        .filter(restrictedOfferAddress => restrictedOfferAddress !== offer.id);
                    if (restrictions.length) {
                        solutionLinkage = offerInfo.linkage;
                    } else {
                        anyLinkage = offerInfo.linkage;
                    }
                }
            )
        );

        return {
            hashes: solutionHashes,
            linkage: solutionLinkage || anyLinkage,
        }
    }

    public static async getTRI(tii: string, decryptionKey: Buffer): Promise<TRI> {
        const tiiObj = JSON.parse(tii);
        tiiObj.tri.key = decryptionKey.toString(tiiObj.tri.encoding);
        const tri: string = await Crypto.decrypt(tiiObj.tri as Encryption);

        const compression = Compression.decode(Buffer.from(tri, (tiiObj.tri as Encryption).encoding));

        let decompressed: Buffer;
        switch (compression.type) {
            case Compression_TYPE.GZIP:
                decompressed = await ungzip(compression.data);
                break;

            default:
                throw Error('Unknown compression method');
        }

        const decoded = TRI.decode(decompressed);
        if (decoded.encryption?.iv) {
            decoded.encryption.iv = Buffer.from(decoded.encryption.iv).toString(tiiObj.tri.encoding) as any;
        }
        if (decoded.encryption?.key) {
            decoded.encryption.key = Buffer.from(decoded.encryption.key).toString(tiiObj.tri.encoding) as any;
        }
        if (decoded.encryption?.mac) {
            decoded.encryption.mac = Buffer.from(decoded.encryption.mac).toString(tiiObj.tri.encoding) as any;
        }
        return decoded;
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
