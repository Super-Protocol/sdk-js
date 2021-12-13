import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import SuspiciousJSON from "../contracts/Suspicious.json";
import { TransactionOptions } from "../types/Web3";
import { checkIfInitialized, createTransactionOptions, checkIfActionAccountInitialized } from "../utils";

class Suspicious {
    public static address: string;
    private static contract: Contract;
    private static logger: typeof rootLogger;

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit() {
        if (this.contract) return;
        checkIfInitialized();

        this.contract = new store.web3!.eth.Contract(<AbiItem[]>SuspiciousJSON.abi, this.address);
        this.logger = rootLogger.child({ className: "Suspicious", address: this.address });
    }

    /**
     * Function generates a list of blocks to be checked in a random way
     * @param tcbAddress - TCB into which other TCBs are recruited from tables for verification
     * @param max - limit for getting blocks (like a batch size)
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async getRandomL2(
        tcbAddress: string,
        max: number,
        transactionOptions?: TransactionOptions
    ): Promise<void> {
        this.checkInit();
        checkIfActionAccountInitialized();
        return await this.contract.methods
            .getRandomL2(tcbAddress, max)
            .send(createTransactionOptions(transactionOptions));
    }

    /**
     * Function for fetching TCB suspect list
     */
    public static async listAll(): Promise<string[]> {
        this.checkInit();
        return await this.contract.methods.listAll().call();
    }

    /**
     * Function for fetching TCB suspect list size
     */
    public static async count(): Promise<string[]> {
        this.checkInit();
        return await this.contract.methods.count().call();
    }
}

export default Suspicious;
