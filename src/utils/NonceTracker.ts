import Web3 from "web3";
import rootLogger from "../logger";

class NonceTracker {
    private store: Record<string, number> = {};
    private static logger = rootLogger.child({ className: "NonceTracker" });

    constructor(private web3: Web3) {
        NonceTracker.logger.trace("Created NonceTracker");
    }

    public async initAccount(address: string): Promise<void> {
        if (address in this.store) {
            return;
        }

        const txCount = await this.web3.eth.getTransactionCount(address);
        if (address in this.store) {
            return;
        }

        NonceTracker.logger.trace(`Initialized ${address} account with nonce: ${txCount}`);

        this.store[address] = txCount;
    }

    public isManaged(address: string): boolean {
        return address in this.store;
    }

    public async reinitialize(): Promise<void> {
        await Promise.all(
            Object.keys(this.store).map(async (address) => {
                const txCount = await this.web3.eth.getTransactionCount(address);
                NonceTracker.logger.trace(`Account ${address} has been reinitialized with nonce: ${txCount}`);
                this.store[address] = txCount;
            }),
        );
        NonceTracker.logger.trace("All accounts has been reinitialized");
    }

    private checkAccount(address: string) {
        if (this.isManaged(address)) {
            return;
        }
        throw Error(`${address} account is not initialized. You must call initAccount before using it.`);
    }

    public getNonce(address: string): number {
        this.checkAccount(address);

        NonceTracker.logger.trace(`Get nonce: ${this.store[address]}`);

        return this.store[address];
    }

    public consumeNonce(address: string): number {
        this.checkAccount(address);

        NonceTracker.logger.trace(`Consume nonce: ${this.store[address] + 1}`);

        return this.store[address]++;
    }
}

export default NonceTracker;
