import store from "../store";

type NonceResult = {
    nextNonce: number;
    done: () => void;
};

class NonceTracker {
    private static store: Record<string, number> = {};

    public static async getTransactionCount(address: string): Promise<number> {
        if (!store.web3) {
            throw new Error("web3 is undefined, needs to run 'await BlockchainConnector.init(CONFIG)' first");
        }

        const txCount = await store.web3.eth.getTransactionCount(address, "pending");

        return txCount;
    }

    public static async getNonce(address: string): Promise<number> {
        const txCount = await this.getTransactionCount(address);
        const txInProgress = this.store[address] || 0;

        return txCount + txInProgress;
    }

    public static async generateNextNonce(address: string): Promise<NonceResult> {
        if (!this.store[address]) {
            this.store[address] = 0;
        }

        const txCount = await this.getTransactionCount(address);
        const nextNonce = txCount + (this.store[address] | 0);
        this.store[address]++;
        let used = false;

        return {
            nextNonce,
            done: () => {
                if (!used) {
                    used = true;
                    this.store[address]--;
                }
            },
        };
    }
}

export default NonceTracker;
