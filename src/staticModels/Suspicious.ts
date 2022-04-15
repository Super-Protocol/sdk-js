import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
// import SuspiciousJSON from "../contracts/Suspicious.json";
import { TransactionOptions } from "../types/Web3";
import { checkIfInitialized, createTransactionOptions, checkIfActionAccountInitialized } from "../utils";

class Suspicious {
    public static address: string;
    private static contract: Contract;
    private static logger: typeof rootLogger;

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit(transactionOptions?: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();
            // return new transactionOptions.web3.eth.Contract(<AbiItem[]>SuspiciousJSON.abi, this.address);
        }

        if (this.contract) return this.contract;
        checkIfInitialized();

        this.logger = rootLogger.child({ className: "Suspicious" });
        // return this.contract = new store.web3!.eth.Contract(<AbiItem[]>SuspiciousJSON.abi, this.address);
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
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        // TODO: stub
        // const contract = this.checkInit(transactionOptions);
        // checkIfActionAccountInitialized();
        // return await contract.methods
        //    .getRandomL2(tcbAddress, max)
        //    .send(await createTransactionOptions(transactionOptions));
    }

    /**
     * Function for fetching TCB suspect list
     */
    public static async listAll(): Promise<string[]> {
        // TODO: stub
        return [];
        // this.checkInit();
        // return await this.contract.methods.listAll().call();
    }

    /**
     * Function for fetching TCB suspect list size
     */
    // TODO: stub
    public static async count(): Promise<string[]> {
        // TODO: stub
        return [];
        // this.checkInit();
        // return await this.contract.methods.count().call();
    }
}

export default Suspicious;
