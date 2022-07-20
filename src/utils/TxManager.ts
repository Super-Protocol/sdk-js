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
            const estimatedGas = await transactionCall.estimateGas(txData);
            txData.gas = Math.floor(estimatedGas * store.gasLimitMultiplier);
        }

        // TODO: Consider a better way to organize different strategies for publishing transactions.
        if (!checkForUsingExternalTxManager(transactionOptions)) {
            if (this.nonceTracker.isManaged(options.from)) {
                txData.nonce = this.nonceTracker.consumeNonce(options.from);
            }
        }
        const signingKey = store.keys[options.from];
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

            return web3.eth.sendSignedTransaction(signed.rawTransaction);
        } else {
            TxManager.logger.debug(
                {
                    txData: lodash.omit(txData, ["data"]),
                },
                "Publishing unsigned transaction",
            );

            return web3.eth.sendTransaction(txData);
        }
    }
}

export default TxManager;
