import rootLogger from "../logger";
import Superpro from "./Superpro";
import { BigNumber } from "ethers";
import BlockchainConnector from "../connectors/BlockchainConnector";
import { incrementMethodCall } from "../utils";

class ActiveOrders {
    private static readonly logger = rootLogger.child({ className: "ActiveOrders" });

    public static get address(): string {
        return Superpro.address;
    }

    /**
     * Function returns amount of active orders
     * @returns {Promise<BigNumber>}
     */
    @incrementMethodCall()
    public static async getListOfActiveOrdersSize(): Promise<BigNumber> {
        const contract = BlockchainConnector.getInstance().getContract();

        return await contract.methods.getListOfActiveOrdersSize().call();
    }

    /**
     * Function returns ids of active orders
     * @returns {Promise<string[]>}
     */
    @incrementMethodCall()
    public static async getListOfActiveOrdersRange(
        begin?: BigNumber | number,
        end?: BigNumber | number,
    ): Promise<string[]> {
        const contract = BlockchainConnector.getInstance().getContract();
        const logger = this.logger.child({ method: "getListOfActiveOrdersRange" });

        begin = begin ?? 0;
        end = end ?? (await contract.methods.getListOfActiveOrdersSize().call());

        return await contract.methods.getListOfActiveOrdersRange(begin, end).call();
    }
}

export default ActiveOrders;
