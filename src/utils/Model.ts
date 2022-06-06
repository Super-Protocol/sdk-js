import { TransactionReceipt } from "web3-core";
import { ContractSendMethod } from "web3-eth-contract";
import NonceTracker from "./NonceTracker";
import store from "../store";
import { TransactionOptions } from "../types/Web3";
import { checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions } from "../utils";
import Superpro from "../staticModels/Superpro";

type ArgumentsType = any | any[];

type MethodReturnType = ContractSendMethod & {
    _parent: {
        _address: string;
    };
};

abstract class Model {
    protected static async execute(
        method: (...args: ArgumentsType) => MethodReturnType,
        args: ArgumentsType,
        transactionOptions?: TransactionOptions,
        to: string = Superpro.address,
    ): Promise<TransactionReceipt> {
        checkIfInitialized();
        checkIfActionAccountInitialized(transactionOptions);

        const web3 = transactionOptions?.web3 || store.web3;

        if (!web3) {
            throw new Error("web3 undefined");
        }

        const transaction = method(...args);
        const rawOptions = await createTransactionOptions(transactionOptions);

        if (!rawOptions.from) {
            throw new Error("Transaction account undefined");
        }

        const nonce = await NonceTracker.generateNextNonce(rawOptions.from);

        try {
            const options = {
                to,
                data: transaction.encodeABI(),
                nonce: nonce.nextNonce,
                ...rawOptions,
            };

            if (store.keys[rawOptions.from]) {
                const key = store.keys[rawOptions.from];
                const signed = await web3.eth.accounts.signTransaction(options, key);
                if (!signed.rawTransaction) {
                    throw new Error("Failed to sign transaction");
                }

                return await web3.eth.sendSignedTransaction(signed.rawTransaction);
            } else {
                return await web3.eth.sendTransaction(options);
            }
        } finally {
            nonce.done();
        }
    }
}

export default Model;
