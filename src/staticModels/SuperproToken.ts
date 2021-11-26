import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import SuperproTokenJSON from "../contracts/SuperproToken.json";
import store from "../store";
import { checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions } from "../utils";
import { TransactionOptions } from "../types/Web3";

class SuperproToken {
    public static address: string;
    private static contract: Contract;
    private static logger: typeof rootLogger;

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit() {
        if (this.contract) return;
        checkIfInitialized();

        this.contract = new store.web3!.eth.Contract(<AbiItem[]>SuperproTokenJSON.abi, this.address);
        this.logger = rootLogger.child({ className: "SuperproToken", address: this.address });
    }

    /**
     * Fetching balance of SuperProtocol tokens on address
     */
    public static async balanceOf(address: string): Promise<number> {
        this.checkInit();
        return await this.contract.methods.balanceOf(address).call();
    }

    /**
     * Transfers specific amount of SP tokens to specific address
     * @param to - address to revive tokens
     * @param amount - amount of tokens to transfer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async transfer(to: string, amount: number, transactionOptions?: TransactionOptions): Promise<number> {
        this.checkInit();
        checkIfActionAccountInitialized();
        return await this.contract.methods.transfer(to, amount).send(createTransactionOptions(transactionOptions));
    }

    /**
     * Approve tokens for specific address
     * @param address - address for approval
     * @param amount - number of tokens to be approved
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async approve(
        address: string,
        amount: number,
        transactionOptions?: TransactionOptions
    ): Promise<void> {
        this.checkInit();
        checkIfActionAccountInitialized();

        await this.contract.methods.approve(address, amount).send(createTransactionOptions(transactionOptions));
    }
}

export default SuperproToken;
