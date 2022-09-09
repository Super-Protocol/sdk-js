import { Contract } from "web3-eth-contract";
import { AbiItem } from "web3-utils";
import BlockchainConnector from "../BlockchainConnector";
import store from "../store";
import { TransactionOptions } from "../types/Web3";
import { checkIfInitialized } from "../utils";
import Superpro from "./Superpro";
import appJSON from "../contracts/app.json";
import { Mark } from "../types/Marks";

class Marks {
    public static get address(): string {
        return Superpro.address;
    }

    static async getProviderMarks(providerAddress: string) {
        const contract = BlockchainConnector.getContractInstance();

        await contract.methods.getProviderMarks(providerAddress).call();
    }

    static async getOrderMark(orderId: string) {
        const contract = BlockchainConnector.getContractInstance();

        await contract.methods.getOrderMark(orderId).call();
    }

    static async setOrderMark(orderId: string, mark: Mark) {
        const contract = BlockchainConnector.getContractInstance();

        await contract.methods.setOrderMark(orderId, mark).call();
    }
}

export default Marks;
