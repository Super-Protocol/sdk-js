import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import ActiveOrdersJSON from "../contracts/ActiveOrdersList.json";
import { checkIfInitialized } from "../utils";
import { TransactionOptions } from "../types/Web3";
import Superpro from "./Superpro";
import { BigNumber } from "ethers";

class ActiveOrders {
    private static contract: Contract;
    private static logger: typeof rootLogger;

    public static get address(): string {
        return Superpro.address;
    }
    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit(transactionOptions?: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();

            return new transactionOptions.web3.eth.Contract(<AbiItem[]>ActiveOrdersJSON.abi, Superpro.address);
        }

        if (this.contract) return this.contract;
        checkIfInitialized();

        this.logger = rootLogger.child({
            className: "ActiveOrder",
            address: Superpro.address,
        });

        return (this.contract = new store.web3!.eth.Contract(<AbiItem[]>ActiveOrdersJSON.abi, Superpro.address));
    }

    /**
     * Function returns amount of active orders
     * @returns {Promise<BigNumber>}
     */
    public static async getListOfActiveOrdersSize(): Promise<BigNumber> {
        this.checkInit();

        return await this.contract.methods.getListOfActiveOrdersSize().call();
    }

    /**
     * Function returns ids of active orders
     * @returns {Promise<string[]>}
     */
    public static async getListOfActiveOrdersRange(
        begin?: BigNumber | number,
        end?: BigNumber | number,
    ): Promise<string[]> {
        this.checkInit();
        const logger = this.logger.child({ method: "getListOfActiveOrdersRange" });

        begin = begin ?? 0;
        end = end ?? (await this.contract.methods.getListOfActiveOrdersSize().call());

        return await this.contract.methods.getListOfActiveOrdersRange(begin, end).call();
    }
}

export default ActiveOrders;
