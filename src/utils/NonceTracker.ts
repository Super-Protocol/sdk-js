import Web3 from "web3";

class NonceTracker {
    private store: Record<string, number> = {};

    constructor(private web3: Web3) {}

    public async initAccount(address: string): Promise<void> {
        if (address in this.store) {
            return;
        }

        const txCount = await this.web3.eth.getTransactionCount(address);
        if (address in this.store) {
            return;
        }
        this.store[address] = txCount;
    }

    private checkAccount(address: string) {
        if (address in this.store) {
            return;
        }
        throw Error(`${address} account is not initialized. You must call initAccount before using it.`);
    }

    public getNonce(address: string): number {
        this.checkAccount(address);

        return this.store[address];
    }

    public consumeNonce(address: string): number {
        this.checkAccount(address);

        return this.store[address]++;
    }
}

export default NonceTracker;
