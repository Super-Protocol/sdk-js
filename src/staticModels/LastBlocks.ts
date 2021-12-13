import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import LastBlocksJSON from "../contracts/LastBlocks.json";
import { checkIfInitialized, createTransactionOptions, checkIfActionAccountInitialized } from "../utils";
import { TransactionOptions } from "../types/Web3";

class LastBlocks {
    public static address: string;
    private static contract: Contract;
    private static logger: typeof rootLogger;

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit() {
        if (this.contract) return;
        checkIfInitialized();

        this.contract = new store.web3!.eth.Contract(<AbiItem[]>LastBlocksJSON.abi, this.address);
        this.logger = rootLogger.child({ className: "LastBlocks", address: this.address });
    }

    /**
     * Function generates a list of blocks to be checked in a random way
     * @param tcbAddress - TCB into which other TCBs are recruited from tables for verification
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async getRandomL1(tcbAddress: string, transactionOptions?: TransactionOptions): Promise<void> {
        this.checkInit();
        checkIfActionAccountInitialized();
        return await this.contract.methods
            .getRandomL1(tcbAddress)
            .send(createTransactionOptions(transactionOptions));
    }

    /**
     * Function for fetching TCB last blocks list
     */
    public static async listAll(): Promise<string[]> {
        this.checkInit();
        return await this.contract.methods.listAll().call();
    }

    /**
     * Function for fetching TCB last blocks list size
     */
    public static async count(): Promise<string[]> {
        this.checkInit();
        //TODO: update after append LastBlocksTable.count()
        return (await this.contract.methods.listAll().call()).length;
    }
}

export default LastBlocks;
