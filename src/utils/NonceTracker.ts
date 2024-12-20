import Web3 from 'web3';
import rootLogger from '../logger.js';
import { Logger } from 'pino';

class NonceTracker {
  private logger: Logger;
  private txCount?: bigint;
  private transactionsOnHold: (() => void)[] | undefined;
  private countOfPendingTransactions = 0;

  constructor(
    private web3: Web3,
    private address: string,
  ) {
    this.logger = rootLogger.child({ className: 'NonceTracker', address });
    this.logger.trace('Created NonceTracker');
  }

  public async initAccount(): Promise<void> {
    this.txCount = await this.web3.eth.getTransactionCount(this.address);
    this.logger.trace(`Initialized ${this.address} account with nonce: ${this.txCount}`);
  }

  public getNonce(): bigint {
    if (this.txCount === undefined)
      throw Error(`NonceTracker for address ${this.address} is not initialized`);

    this.logger.trace(`Get nonce: ${this.txCount}`);

    return this.txCount;
  }

  public consumeNonce(): bigint {
    if (this.txCount === undefined)
      throw Error(`NonceTracker for address ${this.address} is not initialized`);

    this.logger.trace(`Consume nonce: ${this.txCount}. Next nonce: ${this.txCount + BigInt(1)}`);

    return this.txCount++;
  }

  public async onTransactionStartPublishing(): Promise<void> {
    if (this.transactionsOnHold) {
      await this.waitForPendingTransactions();
    }
    this.countOfPendingTransactions++;
  }

  public onTransactionPublished(nonce: bigint): void {
    this.countOfPendingTransactions--;

    if (this.countOfPendingTransactions === 0) {
      this.logger.trace(`last tx published with nonce: ${nonce}. State nonce ${this.txCount}`);

      void this.sendHoldTransactions();
    }
  }

  public async onTransactionError(): Promise<void> {
    this.countOfPendingTransactions--;
    if (!this.transactionsOnHold) this.transactionsOnHold = [];

    if (this.countOfPendingTransactions === 0) {
      await this.sendHoldTransactions();
    } else {
      await this.waitForPendingTransactions();
    }
  }

  private waitForPendingTransactions(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.transactionsOnHold) return resolve();
      this.transactionsOnHold.push(() => {
        resolve();
      });
    });
  }

  private async sendHoldTransactions(): Promise<void> {
    if (!this.transactionsOnHold) return;

    await this.initAccount();
    this.transactionsOnHold.forEach((callback) => callback());
    this.transactionsOnHold = undefined;
  }
}

export default NonceTracker;
