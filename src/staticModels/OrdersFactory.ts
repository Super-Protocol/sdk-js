import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import OrdersJSON from "../contracts/Orders.json";
import { checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions, objectToTuple } from "../utils";
import { OrderInfo, OrderInfoStructure } from "../types/Order";
import { formatBytes32String } from "ethers/lib/utils";
import { ContractEvent, TransactionOptions } from "../types/Web3";
import { OrderCreatedEvent } from "../types/Events";
import Superpro from "./Superpro";
import { BigNumber } from 'ethers';

class OrdersFactory {
    private static contract: Contract;
    private static logger: typeof rootLogger;

    public static orders?: string[];

    public static get address(): string {
        return Superpro.address;
    }
    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit(transactionOptions?: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();
            return new transactionOptions.web3.eth.Contract(<AbiItem[]>OrdersJSON.abi, Superpro.address);
        }

        if (this.contract) return this.contract;
        checkIfInitialized();

        this.logger = rootLogger.child({ className: "OrdersFactory", address: Superpro.address });
        return this.contract = new store.web3!.eth.Contract(<AbiItem[]>OrdersJSON.abi, Superpro.address);
    }

    /**
     * Function for fetching list of all orders addresses
     * @param fromBlock - Number|String (optional): The block number (greater than or equal to) from which to get events on. Pre-defined block numbers as "earliest", "latest" and "pending" can also be used.
     * @param toBlock - Number|String (optional): The block number (less than or equal to) to get events up to (Defaults to "latest"). Pre-defined block numbers as "earliest", "latest" and "pending" can also be used.
     */
    public static async getAllOrders(): Promise<string[]> {
        this.checkInit();
        this.orders = this.orders ?? [];

        const ordersCount = await this.contract.methods.getOrdersCount().call();
        for (let orderId = this.orders.length + 1; orderId <= ordersCount; orderId++) {
            this.orders?.push(orderId.toString());
        }

        return this.orders;
    }

    /**
     * Function for fetching order hold deposit for specific order
     * @param orderAddress - address of order for fetching hold deposit
     */
    public static async getOrderHoldDeposit(orderAddress: string): Promise<number> {
        this.checkInit();
        return await this.contract.methods.getOrderHoldDeposit(orderAddress).call();
    }

    /**
     * Function for adding event listeners on order created event in orders factory contract
     * @param callback - function for processing created order
     * @return unsubscribe - unsubscribe function from event
     */
    public static onOrderCreated(callback: onOrderCreatedCallback): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onOrderCreated" });

        const subscription = this.contract.events
            .OrderCreated()
            .on("data", async (event: ContractEvent) => {
                callback(<string>event.returnValues.orderId);
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    public static onSubOrderCreated(callback: onSubOrderCreatedCallback): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "SubOrderCreated" });

        const subscription = this.contract.events
            .SubOrderCreated()
            .on("data", async (event: ContractEvent) => {
                callback(<string>event.returnValues.subOrderId);
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for creating orders
     * @param orderInfo - order info for new order
     * @param suspended - is orders suspended
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     * @returns {Promise<void>} - Does not return address of created contract!
     */
    public static async createOrder(
        orderInfo: OrderInfo,
        holdDeposit = 0,
        suspended = false,
        externalId = "default",
        transactionOptions?: TransactionOptions,
    ) {
        const contract = this.checkInit(transactionOptions);
        checkIfActionAccountInitialized();

        const orderInfoArguments = objectToTuple(orderInfo, OrderInfoStructure);
        const formattedExternalId = formatBytes32String(externalId);
        await contract.methods
            .createOrder(orderInfoArguments, holdDeposit, suspended, formattedExternalId)
            .send(await createTransactionOptions(transactionOptions));
    }

    public static async getOrder(consumer: string, externalId: string): Promise<OrderCreatedEvent> {
        const contract = this.checkInit();
        const filter = {
            consumer,
            externalId: formatBytes32String(externalId),
        };
        const foundIds = await contract.getPastEvents("OrderCreated", { filter });
        const notFound = { consumer, externalId, offerId: -1, orderId: -1 };

        const response: OrderCreatedEvent =
            foundIds.length > 0 ? (foundIds[0].returnValues as OrderCreatedEvent) : notFound;

        return response;
    }

    /**
     * Function for refilling order deposit
     * @param orderAddress - address of order
     * @param amount - amount of tokens to refilling
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async refillOrderDeposit(
        orderAddress: string,
        amount: number,
        transactionOptions?: TransactionOptions,
    ) {
        const contract = this.checkInit(transactionOptions);
        checkIfActionAccountInitialized();

        await contract.methods
            .refillOrder(orderAddress, amount)
            .send(await createTransactionOptions(transactionOptions));
    }
}

export type onOrderCreatedCallback = (address: string) => void;
export type onSubOrderCreatedCallback = (address: string) => void;

export default OrdersFactory;
