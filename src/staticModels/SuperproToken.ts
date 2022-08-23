import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import { Transaction } from "web3-core";
import appJSON from "../contracts/app.json";
import store from "../store";
import { checkIfActionAccountInitialized, checkIfInitialized } from "../utils";
import { TransactionOptions } from "../types/Web3";
import TxManager from "../utils/TxManager";

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

            return new transactionOptions.web3.eth.Contract(<AbiItem[]>appJSON.abi, this.address);
        }

        if (this.contract) return this.contract;
        checkIfInitialized();

        this.logger = rootLogger.child({
            className: "SuperproToken",
            address: this.address,
        });

        return (this.contract = new store.web3!.eth.Contract(<AbiItem[]>appJSON.abi, this.address));
    }

    /**
     * Fetching balance of SuperProtocol tokens on address
     */
    public static async balanceOf(address: string): Promise<string> {
        this.checkInit();

        return await this.contract.methods.balanceOf(address).call();
    }

    /**
     * Fetching allowance of SuperProtocol tokens on address
     */
    public static async allowance(from: string, to: string): Promise<string> {
        this.checkInit();

        return await this.contract.methods.allowance(from, to).call();
    }

    /**
     * Transfers specific amount of SP tokens to specific address
     * @param to - address to revive tokens
     * @param amount - amount of tokens to transfer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async transfer(
        to: string,
        amount: string,
        transactionOptions?: TransactionOptions,
    ): Promise<Transaction> {
        const contract = this.checkInit(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        const receipt = await TxManager.execute(
            contract.methods.transfer,
            [to, amount],
            transactionOptions,
            SuperproToken.address,
        );

        return store.web3!.eth.getTransaction(receipt.transactionHash);
    }

    /**
     * Approve tokens for specific address
     * @param address - address for approval
     * @param amount - number of tokens to be approved
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async approve(
        address: string,
        amount: string,
        transactionOptions?: TransactionOptions
    ): Promise<void> {
        const contract = this.checkInit(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(contract.methods.approve, [address, amount], transactionOptions, SuperproToken.address);
    }
}

export default SuperproToken;
