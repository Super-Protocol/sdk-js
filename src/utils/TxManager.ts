import { TransactionReceipt, PromiEvent } from "web3-core";
import { ContractSendMethod } from "web3-eth-contract";
import NonceTracker from "./NonceTracker";
import rootLogger from "../logger";
import store from "../store";
import { TransactionOptions } from "../types/Web3";
import { checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions } from "../utils";
import Superpro from "../staticModels/Superpro";
import lodash from "lodash";
import Web3 from "web3";
import BN from "bn.js";

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

    public static async initAccount(address: string): Promise<void> {
        return this.nonceTracker.initAccount(address);
    }

    public static async execute(
        method: (...args: ArgumentsType) => MethodReturnType,
        args: ArgumentsType,
        transactionOptions?: TransactionOptions,
        to: string = Superpro.address,
    ): Promise<TransactionReceipt> {
        checkIfInitialized();
        checkIfActionAccountInitialized(transactionOptions);

        const web3 = transactionOptions?.web3 || this.web3;
        const transaction = method(...args);
        const options = await createTransactionOptions(transactionOptions);
        const from = options.from;

        if (!from) {
            throw new Error("From account is undefined");
        }

        const nonce = this.nonceTracker.consumeNonce(from);

        return TxManager.publishTransaction(web3, transaction, from, to, options, nonce);
    }

    private static async publishTransaction(
        web3: Web3,
        transaction: MethodReturnType,
        from: string,
        to: string,
        options: TransactionOptions,
        nonce: number,
    ): Promise<TransactionReceipt> {
        const txData = {
            to,
            data: transaction.encodeABI(),
            nonce: nonce,
            ...options,
        };
        const signingKey = store.keys[from];
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
