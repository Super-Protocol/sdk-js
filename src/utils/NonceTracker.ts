import Web3 from "web3";
import rootLogger from "../logger";
import { Logger } from "pino";

class NonceTracker {
    private logger: Logger;
    private txCount?: number;
    private transactionsOnHold: (() => void)[] | undefined;
    private countOfPendingTransactions = 0;

    constructor(private web3: Web3, private address: string) {
        this.logger = rootLogger.child({ className: "NonceTracker", address });
        this.logger.trace("Created NonceTracker");
    }

    public async initAccount(): Promise<void> {
        this.txCount = await this.web3.eth.getTransactionCount(this.address);
        this.logger.trace(`Initialized ${this.address} account with nonce: ${this.txCount}`);
    }

    public getNonce(): number {
        if (this.txCount === undefined) throw Error(`NonceTracker for address ${this.address} is not initialized`);

        this.logger.trace(`Get nonce: ${this.txCount}`);
        return this.txCount;
    }

    public consumeNonce(): number {
        if (this.txCount === undefined) throw Error(`NonceTracker for address ${this.address} is not initialized`);

        this.logger.trace(`Consume nonce: ${this.txCount + 1}`);
        return this.txCount++;
    }

    public async onTransactionStartPublishing() {
        if (this.transactionsOnHold) {
            await this.waitForPendingTransactions();
        }
        this.countOfPendingTransactions++;
    }

    public onTransactionPublished() {
        this.countOfPendingTransactions--;

        if (this.countOfPendingTransactions === 0) {
            this.sendHoldTransactions();
        }
    }

    public async onTransactionError() {
        this.countOfPendingTransactions--;
        if (!this.transactionsOnHold) this.transactionsOnHold = [];

        if (this.countOfPendingTransactions === 0) {
            this.sendHoldTransactions();
        } else {
            await this.waitForPendingTransactions();
        }
    }

    private async waitForPendingTransactions() {
        return new Promise<void>((resolve) => {
            if (!this.transactionsOnHold) return resolve();
            this.transactionsOnHold.push(() => {
                resolve();
            });
        });
    }

    private async sendHoldTransactions() {
        if (!this.transactionsOnHold) return;

        await this.initAccount();
        this.transactionsOnHold.forEach((callback) => callback());
        this.transactionsOnHold = undefined;
    }
}

export default NonceTracker;
