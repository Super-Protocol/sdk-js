import nodeGzip from 'node-gzip';
import _ from 'lodash';

import { config } from './config.js';
import { Compression, Compression_TYPE } from './proto/Compression.js';
import { TRI } from './proto/TRI.js';
import Crypto from './crypto/index.js';
import { Offer, Order, TeeOffer, TCB } from './models/index.js';
import { BlockchainId, OrderInfo, OfferInfo, TeeOfferInfo } from './types/index.js';
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
import { TLBlockSerializerV1, TLBlockUnserializeResultType } from '@super-protocol/tee-lib';
import { QuoteValidator } from './tee/QuoteValidator.js';
import { QuoteValidationStatuses } from './tee/statuses.js';
import { TeeSgxParser } from './tee/QuoteParser.js';
import logger from './logger.js';

const { gzip, ungzip } = nodeGzip;

class TIIGenerator {
  static verifiedTlbHashes: Map<string, string> = new Map();
  static verifiedTcbs: Set<BlockchainId> = new Set();

  private static async checkQuote(
    quote: Uint8Array,
    dataBlob: Uint8Array,
    sgxApiUrl: string,
  ): Promise<void> {
    const quoteBuffer = Buffer.from(quote);
    const validator = new QuoteValidator(sgxApiUrl);
    const quoteStatus = await validator.validate(quoteBuffer);
    if (quoteStatus.quoteValidationStatus !== QuoteValidationStatuses.UpToDate) {
      if (quoteStatus.quoteValidationStatus === QuoteValidationStatuses.Error) {
        throw new Error('Quote is invalid');
      } else {
        logger.warn(quoteStatus, 'Quote validation status is not UpToDate');
      }
    }

    const userDataCheckResult = await validator.isQuoteHasUserData(
      quoteBuffer,
      Buffer.from(dataBlob),
    );
    if (!userDataCheckResult) {
      throw new Error('Quote has invalid user data');
    }

    const parser = new TeeSgxParser();
    const parsedQuote = parser.parseQuote(quote);
    const report = parser.parseReport(parsedQuote.report);
    if (report.mrSigner.toString('hex') !== config.TEE_LOADER_TRUSTED_MRSIGNER) {
      throw new Error('Quote has invalid MR signer');
    }
  }

  public static async verifyTcb(
    tcb: TCB,
    quoteString: string,
    pubKey: string,
    sgxApiUrl: string,
  ): Promise<void> {
    // check cache
    if (this.verifiedTcbs.has(tcb.tcbId)) {
      logger.trace(`Tcb id = ${tcb.tcbId}, already validated`);
      return;
    }

    const quote = Buffer.from(quoteString, 'base64');
    const signedTcbData = {
      checkingTcbId: tcb.tcbId.toString(),
      pubKey,
      ...(await tcb.getPublicData()),
    };
    const serializer = new TLBlockSerializerV1();
    const dataBlob = await serializer.serializeAnyData(signedTcbData);
    await this.checkQuote(quote, dataBlob, sgxApiUrl);

    // update cashe
    this.verifiedTcbs.add(tcb.tcbId);
    if (this.verifiedTcbs.size > config.TLB_CACHE_SIZE) {
      const [value] = this.verifiedTcbs.entries().next().value;
      this.verifiedTcbs.delete(value);
      logger.trace(
        value,
        `TCB id = ${value} removed from the cache. Cache size: ${this.verifiedTcbs.size}, cache limit: ${config.TLB_CACHE_SIZE}`,
      );
    }
    logger.trace(
      tcb.tcbId,
      `TCB id = ${tcb.tcbId} added to the cache. Cache size: ${this.verifiedTcbs.size}, cache limit: ${config.TLB_CACHE_SIZE}`,
    );
  }

  public static async verifyTlb(
    tlb: TLBlockUnserializeResultType,
    tlbString: string,
    offerId: string,
    sgxApiUrl: string,
  ): Promise<void> {
    const tlbHash = await Crypto.createHash(Buffer.from(tlbString), {
      algo: HashAlgorithm.SHA256,
      encoding: Encoding.base64,
    });
    if (this.verifiedTlbHashes.has(tlbHash.hash)) {
      logger.trace(
        tlbHash,
        `TLB hash of offer ${this.verifiedTlbHashes.get(
          tlbHash.hash,
        )} loaded from the cache. Cache size: ${this.verifiedTlbHashes.size}, cache limit: ${
          config.TLB_CACHE_SIZE
        }`,
      );
      return;
    }

    const quoteBuffer = Buffer.from(tlb.quote);
    await this.checkQuote(quoteBuffer, tlb.dataBlob, sgxApiUrl);

    this.verifiedTlbHashes.set(tlbHash.hash, offerId);
    if (this.verifiedTlbHashes.size > config.TLB_CACHE_SIZE) {
      const [key, value] = this.verifiedTlbHashes.entries().next().value;
      this.verifiedTlbHashes.delete(key);
      logger.trace(
        key,
        `TLB hash of offer ${value} removed from the cache. Cache size: ${this.verifiedTlbHashes.size}, cache limit: ${config.TLB_CACHE_SIZE}`,
      );
    }
    logger.trace(
      tlbHash.hash,
      `TLB hash of offer ${offerId} added to the cache. Cache size: ${this.verifiedTlbHashes.size}, cache limit: ${config.TLB_CACHE_SIZE}`,
    );
  }

  public static async generateByOffer(
    offerId: BlockchainId,
    solutionHashes: Hash[],
    linkageString: string | undefined,
    resource: Resource,
    args: any,
    encryption: Encryption,
    sgxApiUrl: string,
  ): Promise<string> {
    const teeOffer: TeeOffer = new TeeOffer(offerId);
    const teeOfferInfo: TeeOfferInfo = await teeOffer.getInfo();
    const linkage: Linkage = linkageString
      ? JSON.parse(linkageString)
      : {
          encoding: Encoding.base64,
          mrenclave: '',
        };

    const serializer = new TLBlockSerializerV1();
    const tcbId = await teeOffer.getActualTcbId();
    const verifyByTcb = Number.parseInt(tcbId) != 0;

    let blockEncryption: Encryption;
    if (verifyByTcb) {
      const tcb = new TCB(await teeOffer.getActualTcbId());
      const { pubKey, quote } = await tcb.getUtilityData();
      await this.verifyTcb(tcb, quote, pubKey, sgxApiUrl);

      // TODO: must be 'blockEncryption = JSON.parse(pubKey);'
      blockEncryption = {
        algo: CryptoAlgorithm.ECIES,
        key: pubKey,
        encoding: Encoding.base64,
      };
    } else {
      const tlb: TLBlockUnserializeResultType = serializer.unserializeTlb(
        Buffer.from(teeOfferInfo.tlb, 'base64'),
      );
      await this.verifyTlb(tlb, teeOfferInfo.tlb, offerId, sgxApiUrl);
      blockEncryption = {
        algo: CryptoAlgorithm.ECIES,
        key: Buffer.from(tlb.data.teePubKeyData).toString('base64'),
        encoding: Encoding.base64,
      };
    }

    // TODO: check env with SP-149
    const mac = (encryption as any).authTag || (encryption as EncryptionWithMacIV).mac;
    const rawTri = {
      solutionHashes: solutionHashes.map((hash) => ({
        algo: hash.algo,
        hash: Buffer.from(hash.hash, hash.encoding),
      })),
      mrenclave: Buffer.from(linkage.mrenclave, linkage.encoding),
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

    const { hashes, linkage } = await this.getSolutionHashesAndLinkage(
      parentOrderInfo.args.inputOffers,
    );

    return this.generateByOffer(
      parentOrderInfo.offerId,
      hashes,
      linkage,
      resource,
      args,
      encryption,
      sgxApiUrl,
    );
  }

  public static async getSolutionHashesAndLinkage(
    inputOffers: BlockchainId[],
  ): Promise<{ hashes: Hash[]; linkage?: string }> {
    const solutionHashes: Hash[] = [];
    let solutionLinkage: string | undefined;
    let anyLinkage: string | undefined;
    await Promise.all(
      inputOffers.map(async (offerId): Promise<void> => {
        const offer: Offer = new Offer(offerId);
        const offerInfo: OfferInfo = await offer.getInfo();

        if (offerInfo.hash) {
          solutionHashes.push(JSON.parse(offerInfo.hash));
        }

        const restrictions = _.intersection(offerInfo.restrictions.offers, inputOffers).filter(
          (restrictedOfferId) => restrictedOfferId !== offer.id,
        );
        if (restrictions.length) {
          solutionLinkage = offerInfo.linkage;
        } else {
          anyLinkage = offerInfo.linkage;
        }
      }),
    );

    return {
      hashes: solutionHashes,
      linkage: solutionLinkage || anyLinkage,
    };
  }

  public static async getTRI(tii: string, decryptionKey: Buffer): Promise<TeeRunInfo> {
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

    return {
      solutionHashes: decoded.solutionHashes.map((hash) => ({
        hash: Buffer.from(hash.hash).toString(Encoding.base64),
        algo: hash.algo as HashAlgorithm,
        encoding: Encoding.base64,
      })),
      linkage: {
        encoding: Encoding.base64,
        mrenclave: Buffer.from(decoded.mrenclave).toString(Encoding.base64),
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

export default TIIGenerator;
