import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import { Transaction } from "web3-core";
import appJSON from "../contracts/app.json";
import store from "../store";
import { checkIfActionAccountInitialized, checkIfInitialized } from "../utils";
import { TransactionOptions, ContractEvent, BlockInfo } from "../types/Web3";
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
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = this.checkInit(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(contract.methods.approve, [address, amount], transactionOptions, SuperproToken.address);
    }

    public static onTokenApprove(callback: onTokenApproveCallback, owner?: string, spender?: string): () => void {
        const contract = this.checkInit();
        const logger = this.logger.child({ method: "onTokenApprove" });

        const subscription = contract.events
            .Approval()
            .on("data", async (event: ContractEvent) => {
                if (owner && event.returnValues.owner != owner) {
                    return;
                }
                if (spender && event.returnValues.spender != spender) {
                    return;
                }
                callback(
                    <string>event.returnValues.owner,
                    <string>event.returnValues.spender,
                    <string>event.returnValues.value,
                    {
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    public static onTokenTransfer(callback: onTokenTransferCallback, from?: string, to?: string): () => void {
        const contract = this.checkInit();
        const logger = this.logger.child({ method: "onTokenTransfer" });

        const subscription = contract.events
            .Approval()
            .on("data", async (event: ContractEvent) => {
                if (from && event.returnValues.from != from) {
                    return;
                }
                if (to && event.returnValues.to != to) {
                    return;
                }
                callback(
                    <string>event.returnValues.from,
                    <string>event.returnValues.to,
                    <string>event.returnValues.value,
                    {
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }
}

export type onTokenApproveCallback = (owner: string, spender: string, value: string, block?: BlockInfo) => void;
export type onTokenTransferCallback = (from: string, to: string, value: string, block?: BlockInfo) => void;

export default SuperproToken;
