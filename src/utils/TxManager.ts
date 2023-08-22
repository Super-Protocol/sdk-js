import { TransactionReceipt } from "web3-core";
import { ContractSendMethod } from "web3-eth-contract";
import NonceTracker from "./NonceTracker";
import rootLogger from "../logger";
import store from "../store";
import { TransactionOptions, DryRunError } from "../types/Web3";
import { checkForUsingExternalTxManager, checkIfActionAccountInitialized, createTransactionOptions } from "../utils";
import Superpro from "../staticModels/Superpro";
import { defaultGasLimit } from "../constants";
import lodash from "lodash";
import Web3 from "web3";

interface EvmError extends Error {
    data: {
        message?: string;
    };
}

class Web3TransactionError extends Error {
    public readonly originalError: unknown;
    constructor(originalError: unknown, message: string) {
        super(message);
        this.name = "Web3TransactionError";
        this.originalError = originalError;
    }
}

export class Web3TransactionRevertedByEvmError extends Web3TransactionError {
    constructor(originalError: unknown, message: string) {
        super(originalError, message);
        this.name = "Web3TransactionRevertedByEvmError";
    }
}

type ArgumentsType = any | any[];

type MethodReturnType = ContractSendMethod & {
    _parent: {
        _address: string;
    };
};

class TxManager {
    private static web3: Web3;
    private static logger = rootLogger.child({ className: "TxManager" });
    private static nonceTrackers: { [address: string]: NonceTracker } = {};

    public static init(web3: Web3) {
        this.web3 = web3;
    }

    private static checkIfInitialized() {
        if (!this.web3) {
            throw Error("TxManager should be initialized before using.");
        }
    }

    public static async initAccount(address: string): Promise<void> {
        if (this.nonceTrackers[address]) return;
        this.nonceTrackers[address] = new NonceTracker(this.web3, address);
        await this.nonceTrackers[address].initAccount();
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

        return await TxManager.publishTransaction(txData, transactionOptions, transaction);
    }

    public static async dryRun(
        method: (...args: ArgumentsType) => MethodReturnType,
        args: ArgumentsType,
        transactionOptions?: TransactionOptions,
    ): Promise<any> {
        const transaction = method(...args);
        const from = transactionOptions?.from ?? store.actionAccount;
        let result;

        try {
            result = await transaction.call({ from });

            return result;
        } catch (e) {
            (e as DryRunError).txErrorMsg = (e as EvmError).data.message || "Error text is undefined";
            throw e;
        }
    }

    public static async publishTransaction(
        txData: Record<string, any>,
        transactionOptions?: TransactionOptions,
        transactionCall?: MethodReturnType,
    ): Promise<TransactionReceipt> {
        this.checkIfInitialized();
        checkIfActionAccountInitialized(transactionOptions);

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
            txData.gas = estimatedGas;
            txData.gas = Math.ceil(txData.gas * store.gasLimitMultiplier);
            // defaultGasLimit is max gas limit
            txData.gas = txData.gas < defaultGasLimit ? txData.gas : defaultGasLimit;

            if (options.gas) {
                if (options.gas < estimatedGas) {
                    TxManager.logger.warn(
                        {
                            estimated: estimatedGas,
                            specified: options.gas,
                        },
                        "Fail to calculate estimated gas",
                    );
                }
                txData.gas = options.gas;
            }

            txData.gasPrice = Math.ceil(txData.gasPrice * store.gasPriceMultiplier);
        }

        let nonceTracker;
        // TODO: Consider a better way to organize different strategies for publishing transactions.
        if (!checkForUsingExternalTxManager(transactionOptions) && this.nonceTrackers[options.from]) {
            nonceTracker = this.nonceTrackers[options.from];
            await nonceTracker.onTransactionStartPublishing();
            txData.nonce = nonceTracker.consumeNonce();
        }
        const signingKey = store.keys[options.from];
        try {
            let transactionResultData;
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

                transactionResultData = await web3.eth.sendSignedTransaction(signed.rawTransaction);

                TxManager.logger.debug(
                    {
                        txHash: signed.transactionHash,
                        txBlockNumber: transactionResultData.blockNumber,
                        txGasUsed: transactionResultData.gasUsed,
                    },
                    "Transaction result",
                );
            } else {
                TxManager.logger.debug(
                    {
                        txData: lodash.omit(txData, ["data"]),
                    },
                    "Publishing unsigned transaction",
                );

                transactionResultData = await web3.eth.sendTransaction(txData);
            }

            if (nonceTracker) nonceTracker.onTransactionPublished();

            return transactionResultData;
        } catch (e: any) {
            const message = "Error during transaction execution";
            TxManager.logger.error(e, message);
            if (nonceTracker) await nonceTracker.onTransactionError();
            if (e.message?.includes("Transaction has been reverted by the EVM")) {
                throw new Web3TransactionRevertedByEvmError(e, message);
            } else {
                throw new Web3TransactionError(e, message);
            }
        }
    }
}

export default TxManager;
