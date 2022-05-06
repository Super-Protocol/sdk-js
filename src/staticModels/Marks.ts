import { Contract } from "web3-eth-contract";
import { AbiItem } from "web3-utils";

import store from "../store";
import { TransactionOptions } from "../types/Web3";
import { checkIfInitialized } from "../utils";
import Superpro from "./Superpro";
import MarksJSON from "../contracts/Marks.json";
import { Mark } from "../types/Marks";

class Marks {
    private static contract: Contract;

    public static get address(): string {
        return Superpro.address;
    }
    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit(transactionOptions?: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();
            return new transactionOptions.web3.eth.Contract(<AbiItem[]>MarksJSON.abi, Superpro.address);
        }

        if (this.contract) return this.contract;
        checkIfInitialized();

        return this.contract = new store.web3!.eth.Contract(<AbiItem[]>MarksJSON.abi, Superpro.address);
    }

    static async getProviderMarks(providerAddress: string) {
        this.checkInit();
        await this.contract.methods.getProviderMarks(providerAddress).call();
    }

    static async getOrderMark(orderId: string) {
        this.checkInit();
        await this.contract.methods.getOrderMark(orderId).call();
    }

    static async setOrderMark(orderId: string, mark: Mark) {
        this.checkInit();
        await this.contract.methods.setOrderMark(orderId, mark).call();
    }
}

export default Marks;
