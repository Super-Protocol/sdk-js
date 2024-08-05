import { HashAlgorithm, Encoding } from '@super-protocol/dto-js';
import { TLBlockSerializerV1, TLBlockUnserializeResultType } from '@super-protocol/tee-lib';
import logger from '../logger.js';
import { config } from '../config.js';
import { TCB } from '../models/index.js';
import { TeeSgxParser } from './QuoteParser.js';
import { QuoteValidator } from './QuoteValidator.js';
import { QuoteValidationStatuses } from './statuses.js';
import { BlockchainId } from '../types/index.js';
import Crypto from '../crypto/index.js';

export class TeeBlockVerifier {
  private static readonly verifiedTlbHashes: Map<string, string> = new Map();
  private static readonly verifiedTcbs: Set<BlockchainId> = new Set();

  static async checkQuote(
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

  static async verifyTcb(
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

    // update cache
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

  static async verifyTlb(
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
}
