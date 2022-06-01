import store from "../store";

class NonceTracker {
    private static store: Record<string, number> = {};

    public static async getTransactionCount(address: string): Promise<number> {
        if (!store.web3) {
            throw new Error("web3 is undefined, needs to run 'await BlockchainConnector.init(CONFIG)' first");
        }

        const txCount = await store.web3.eth.getTransactionCount(address, "pending");

        return txCount;
    }

    public static getNonce(address: string): number {
        return this.store[address] || 0;
    }

    public static async generateNextNonce(address: string): Promise<number> {
        const txCount = await this.getTransactionCount(address);
        this.store[address] = Math.max(txCount, this.store[address] || 0);

        return this.store[address]++;
    }
}

export default NonceTracker;
