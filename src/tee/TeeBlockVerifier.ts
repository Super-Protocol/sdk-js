import logger from '../logger.js';
import { config } from '../config.js';
import { TCB } from '../models/index.js';
import { QuoteValidator } from './QuoteValidator.js';
import { BlockchainId } from '../types/index.js';
import { TcbDataSerializer } from './TcbSerializer.js';

export class TeeBlockVerifier {
  private static readonly verifiedTcbs: Set<BlockchainId> = new Set();

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

    const validator = new QuoteValidator(sgxApiUrl);
    await validator.checkQuote(quote, TcbDataSerializer.serialize(signedTcbData));
    await validator.checkSignature(quote);

    // update cache
    this.verifiedTcbs.add(tcb.tcbId);
    if (this.verifiedTcbs.size > config.TLB_CACHE_SIZE) {
      const [value] = this.verifiedTcbs.entries().next().value as [string, string];
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
}
