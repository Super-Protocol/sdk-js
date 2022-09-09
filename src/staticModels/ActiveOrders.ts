import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import appJSON from "../contracts/app.json";
import { checkIfInitialized } from "../utils";
import { TransactionOptions } from "../types/Web3";
import Superpro from "./Superpro";
import { BigNumber } from "ethers";
import BlockchainConnector from "../BlockchainConnector";

class ActiveOrders {
    private static logger: typeof rootLogger;

    public static get address(): string {
        return Superpro.address;
    }

    /**
     * Function returns amount of active orders
     * @returns {Promise<BigNumber>}
     */
    public static async getListOfActiveOrdersSize(): Promise<BigNumber> {
        const contract = BlockchainConnector.getContractInstance();

        return await contract.methods.getListOfActiveOrdersSize().call();
    }

    /**
     * Function returns ids of active orders
     * @returns {Promise<string[]>}
     */
    public static async getListOfActiveOrdersRange(
        begin?: BigNumber | number,
        end?: BigNumber | number,
    ): Promise<string[]> {
        const contract = BlockchainConnector.getContractInstance();
        const logger = this.logger.child({ method: "getListOfActiveOrdersRange" });

        begin = begin ?? 0;
        end = end ?? (await contract.methods.getListOfActiveOrdersSize().call());

        return await contract.methods.getListOfActiveOrdersRange(begin, end).call();
    }
}

export default ActiveOrders;
