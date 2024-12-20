import nodeGzip from 'node-gzip';

import { Compression, Compression_TYPE } from './proto/Compression.js';
import { TRI } from './proto/TRI.js';
import Crypto from './crypto/index.js';
import { Order, TeeOffer } from './models/index.js';
import { BlockchainId, OrderInfo, TeeOfferInfo } from './types/index.js';
import {
  Cipher,
  CryptoAlgorithm,
  Encoding,
  Encryption,
  EncryptionWithMacIV,
  Hash,
  HashAlgorithm,
  Linkage,
  Resource,
  TeeRunInfo,
  UrlResource,
} from '@super-protocol/dto-js';
import TeeInputGeneratorBase from './TeeInputGeneratorBase.js';

const { gzip, ungzip } = nodeGzip;

class TIIGenerator extends TeeInputGeneratorBase {
  public static async generateByOffer({
    offerId,
    solutionHashes,
    imageHashes,
    linkageString,
    resource,
    args,
    encryption,
    sgxApiUrl,
  }: GenerateByOfferParams): Promise<string> {
    const teeOffer: TeeOffer = new TeeOffer(offerId);
    const teeOfferInfo: TeeOfferInfo = await teeOffer.getInfo();
    const linkage: Linkage = linkageString
      ? JSON.parse(linkageString)
      : {
          encoding: Encoding.base64,
          mrenclave: '',
          mrsigner: '',
        };

    const blockEncryption = await this.getVerifiedBlockEncryption(offerId, sgxApiUrl);

    // TODO: check env with SP-149
    const mac = (encryption as any).authTag || (encryption as EncryptionWithMacIV).mac;
    const rawTri = {
      solutionHashes: solutionHashes.map((hash) => ({
        algo: hash.algo,
        hash: Buffer.from(hash.hash, hash.encoding),
      })),
      imageHashes: imageHashes.map((hash) => ({
        algo: hash.algo,
        hash: Buffer.from(hash.hash, hash.encoding),
      })),
      mrenclave: Buffer.from(linkage.mrenclave, linkage.encoding),
      mrsigner: Buffer.from(linkage.mrsigner, linkage.encoding),
      args: JSON.stringify(args || ''),
      encryption: {
        ...encryption,
        ciphertext: encryption.ciphertext
          ? Buffer.from(encryption.ciphertext, encryption.encoding)
          : undefined,
        key: encryption.key ? Buffer.from(encryption.key, encryption.encoding) : undefined,
        iv: (encryption as EncryptionWithMacIV).iv
          ? Buffer.from((encryption as EncryptionWithMacIV).iv, encryption.encoding)
          : undefined,
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
        blockEncryption,
      ),
    });
  }

  public static async generate(
    orderId: BlockchainId,
    resource: Resource,
    args: any,
    encryption: Encryption,
    sgxApiUrl: string,
  ): Promise<string> {
    const order: Order = new Order(orderId);

    const parentOrderId = await order.getParentOrder();
    const parentOrder: Order = new Order(parentOrderId);
    const parentOrderInfo: OrderInfo = await parentOrder.getOrderInfo();

    const { solutionHashes, imageHashes, linkage } = await this.getOffersHashesAndLinkage(
      parentOrderInfo.args.inputOffersIds,
    );

    return this.generateByOffer({
      offerId: parentOrderInfo.offerId,
      solutionHashes,
      imageHashes,
      linkageString: linkage,
      resource,
      args,
      encryption,
      sgxApiUrl,
    });
  }

  public static async getTRI(tii: string, decryptionKey: Buffer): Promise<TeeRunInfo> {
    const tiiObj = JSON.parse(tii);
    tiiObj.tri.key = decryptionKey.toString(tiiObj.tri.encoding);
    const tri: string = await Crypto.decrypt(tiiObj.tri as Encryption);

    const compression = Compression.decode(Buffer.from(tri, tiiObj.tri.encoding));

    let decompressed: Buffer;
    switch (compression.type) {
      case Compression_TYPE.GZIP:
        decompressed = await ungzip(compression.data);
        break;

      default:
        throw Error('Unknown compression method');
    }

    const decoded = TRI.decode(decompressed);

    return {
      solutionHashes: decoded.solutionHashes.map((hash) => ({
        hash: Buffer.from(hash.hash).toString(Encoding.base64),
        algo: hash.algo as HashAlgorithm,
        encoding: Encoding.base64,
      })),
      imageHashes: decoded.imageHashes.map((hash) => ({
        hash: Buffer.from(hash.hash).toString(Encoding.base64),
        algo: hash.algo as HashAlgorithm,
        encoding: Encoding.base64,
      })),
      linkage: {
        encoding: Encoding.base64,
        mrenclave: Buffer.from(decoded.mrenclave).toString(Encoding.base64),
        mrsigner: Buffer.from(decoded.mrsigner).toString(Encoding.base64),
      },
      args: decoded.args,
      encryption: {
        algo: decoded.encryption!.algo as CryptoAlgorithm,
        cipher: decoded.encryption!.cipher! as Cipher,
        encoding: Encoding.base64,
        key: Buffer.from(decoded.encryption!.key!).toString(Encoding.base64),
        iv:
          decoded.encryption!.iv && Buffer.from(decoded.encryption!.iv!).toString(Encoding.base64),
        mac:
          decoded.encryption!.mac &&
          Buffer.from(decoded.encryption!.mac!).toString(Encoding.base64),
      } as EncryptionWithMacIV,
    };
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

export type GenerateByOfferParams = {
  offerId: BlockchainId;
  solutionHashes: Hash[];
  imageHashes: Hash[];
  linkageString: string | undefined;
  resource: Resource;
  args: any;
  encryption: Encryption;
  sgxApiUrl: string;
};

export default TIIGenerator;
