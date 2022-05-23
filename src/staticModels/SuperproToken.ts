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
    private static checkInit(transactionOptions?: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();
            return new transactionOptions.web3.eth.Contract(<AbiItem[]>SuperproTokenJSON.abi, this.address);
        }

        if (this.contract) return this.contract;
        checkIfInitialized();

        this.logger = rootLogger.child({ className: "SuperproToken", address: this.address });
        return this.contract = new store.web3!.eth.Contract(<AbiItem[]>SuperproTokenJSON.abi, this.address);
    }

    /**
     * Fetching balance of SuperProtocol tokens on address
     */
    public static async balanceOf(address: string): Promise<string> {
        this.checkInit();

        return await this.contract.methods.balanceOf(address).call();
    }

    /**
     * Transfers specific amount of SP tokens to specific address
     * @param to - address to revive tokens
     * @param amount - amount of tokens to transfer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async transfer(to: string, amount: number, transactionOptions?: TransactionOptions): Promise<void> {
        const contract = this.checkInit(transactionOptions);
        checkIfActionAccountInitialized();

        await contract.methods.transfer(to, amount).send(await createTransactionOptions(transactionOptions));
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
        const contract = this.checkInit(transactionOptions);
        checkIfActionAccountInitialized();

        await contract.methods.approve(address, amount).send(await createTransactionOptions(transactionOptions));
    }
}

export default SuperproToken;
