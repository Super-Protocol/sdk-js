import { TransactionReceipt } from "web3-core";
import { ContractSendMethod } from "web3-eth-contract";
import NonceTracker from "./NonceTracker";
import rootLogger from "../logger";
import store from "../store";
import { TransactionOptions } from "../types/Web3";
import {
    checkForUsingExternalTxManager,
    checkIfActionAccountInitialized,
    checkIfInitialized,
    createTransactionOptions,
} from "../utils";
import Superpro from "../staticModels/Superpro";
import { defaultGasLimit } from "../constants";
import lodash from "lodash";
import Web3 from "web3";

type ArgumentsType = any | any[];

type MethodReturnType = ContractSendMethod & {
    _parent: {
        _address: string;
    };
};

class TxManager {
    private static web3: Web3;
    private static nonceTracker: NonceTracker;
    private static logger = rootLogger.child({ className: "TxManager" });
    private static transactionsOnHold: (()=>void)[]|undefined;
    private static countOfPendingTransactions = 0;

    public static init(web3: Web3) {
        this.web3 = web3;
        this.nonceTracker = new NonceTracker(web3);
    }

    private static checkIfInitialized() {
        if (!this.web3) {
            throw Error("TxManager should be initialized before using.");
        }
    }

    public static async initAccount(address: string): Promise<void> {
        return this.nonceTracker.initAccount(address);
    }

    public static async execute(
        method: (...args: ArgumentsType) => MethodReturnType,
        args: ArgumentsType,
        transactionOptions?: TransactionOptions,
        to: string = Superpro.address,
    ): Promise<TransactionReceipt> {
        const transaction = method(...args);
        const txData: Record<string, any> = {
            to,
            data: transaction.encodeABI(),
        };

        return TxManager.publishTransaction(txData, transactionOptions, transaction);
    }

    public static async publishTransaction(
        txData: Record<string, any>,
        transactionOptions?: TransactionOptions,
        transactionCall?: MethodReturnType,
    ): Promise<TransactionReceipt> {
        this.checkIfInitialized();
        checkIfInitialized();
        checkIfActionAccountInitialized(transactionOptions);

        await this.onStartPublishing();

        const web3 = transactionOptions?.web3 || this.web3;
        const options = await createTransactionOptions({ ...transactionOptions });
        if (!options.from) {
            throw Error("From account is undefined. You should pass it to transactionOptions or init action account.");
        }

        txData = {
            ...options,
            ...txData,
        };

        if (transactionCall) {
            let estimatedGas;
            try {
                estimatedGas = await transactionCall.estimateGas(txData);
            } catch (e) {
                TxManager.logger.debug({ error: e }, "Fail to calculate estimated gas");
                estimatedGas = defaultGasLimit;
            }
            txData.gas = Math.ceil(estimatedGas * store.gasLimitMultiplier);
        }

        // TODO: Consider a better way to organize different strategies for publishing transactions.
        if (!checkForUsingExternalTxManager(transactionOptions)) {
            if (this.nonceTracker.isManaged(options.from)) {
                txData.nonce = this.nonceTracker.consumeNonce(options.from);
            }
        }
        const signingKey = store.keys[options.from];
        try {
            if (signingKey) {
                const signed = await web3.eth.accounts.signTransaction(txData, signingKey);
                if (!signed.rawTransaction) {
                    throw new Error("Failed to sign transaction");
                }

                TxManager.logger.debug(
                    {
                        txHash: signed.transactionHash,
                        txData: lodash.omit(txData, ["data"]),
                    },
                    "Publishing signed transaction",
                );

                const data = await web3.eth.sendSignedTransaction(signed.rawTransaction);
                this.onFinishPublishing();
                return data;
            } else {
                TxManager.logger.debug(
                    {
                        txData: lodash.omit(txData, ["data"]),
                    },
                    "Publishing unsigned transaction",
                );

                const data = await web3.eth.sendTransaction(txData);
                this.onFinishPublishing();
                return data;
            }
        } catch (e) {
            TxManager.logger.error(e, "Error during transaction execution");
            await this.onError();
            throw e;
        }
    }

    private static async onStartPublishing () {
        this.countOfPendingTransactions++;
        if (!this.transactionsOnHold) return;

        // Wait for pending transactions
        await new Promise<void>(resolve => {
            if (!this.transactionsOnHold) return resolve();
            this.transactionsOnHold.push(() => {
                resolve();
            });
        });
    }

    private static async onError () {
        this.countOfPendingTransactions--;
        if (this.countOfPendingTransactions === 0) return;

        // Wait for pending transactions
        this.transactionsOnHold = [];
        await new Promise<void>(resolve => {
            if (!this.transactionsOnHold) return resolve();
            this.transactionsOnHold.push(() => {
                resolve();
            });
        });
    }

    private static onFinishPublishing () {
        this.countOfPendingTransactions--;

        if (this.countOfPendingTransactions === 0 && this.transactionsOnHold) {
            this.nonceTracker.reinitialize().then(() => {
                this.transactionsOnHold?.forEach(callback => callback());
                this.transactionsOnHold = undefined;
            });
        }
    }
}

export default TxManager;
