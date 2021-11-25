import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import OrdersFactoryJSON from "../contracts/OrdersFactory.json";
import { checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions } from "../utils";
import { OrderInfo, OrderInfoArguments } from "../types/Order";
import _ from "lodash";
import { ContractEvent, TransactionOptions } from "../types/Web3";

class OrdersFactory {
    public static address: string;
    private static contract: Contract;
    private static logger: typeof rootLogger;

    public static orders?: string[];

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit() {
        if (this.contract) return;
        checkIfInitialized();

        this.contract = new store.web3!.eth.Contract(<AbiItem[]>OrdersFactoryJSON.abi, this.address);
        this.logger = rootLogger.child({ className: "OrdersFactory", address: this.address });
    }

    /**
     * Function for fetching list of all orders addresses
     */
    public static async getAllOrders(): Promise<string[]> {
        this.checkInit();
        this.orders = await this.contract.methods.listAll().call();
        return this.orders!;
    }

    /**
     * Function for adding event listeners on order created event in orders factory contract
     * @param callback - function for processing created order
     * @return unsubscribe - unsubscribe function from event
     */
    public static onOrderCreated(callback: onOrderCreatedCallback): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onOrderCreated" });

        let subscription = this.contract.events
            .OrderCreated()
            .on("data", async (event: ContractEvent) => {
                callback(<string>event.returnValues.newOrderAddress);
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
     * @returns Promise<void> - Does not return address of created contract!
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async createOrder(orderInfo: OrderInfo, transactionOptions?: TransactionOptions) {
        this.checkInit();
        checkIfActionAccountInitialized();

        // Convert order info to array (used in blockchain)
        const subOrderInfoArguments = _.at(orderInfo, OrderInfoArguments);

        await this.contract.methods.create(subOrderInfoArguments).send(createTransactionOptions(transactionOptions));
    }

    /**
     * Function for creating sub orders
     * @param orderAddress - address of parent order
     * @param subOrderInfo - order info for new subOrder
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     * @returns Promise<void> - Does not return address of created contract!
     */
    public static async createSubOrder(
        orderAddress: string,
        subOrderInfo: OrderInfo,
        transactionOptions?: TransactionOptions
    ) {
        this.checkInit();
        checkIfActionAccountInitialized();

        // Convert order info to array (used in blockchain)
        const subOrderInfoArguments = _.at(subOrderInfo, OrderInfoArguments);

        await this.contract.methods
            .createSubOrder(orderAddress, subOrderInfoArguments)
            .send(createTransactionOptions(transactionOptions));
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
        transactionOptions?: TransactionOptions
    ) {
        this.checkInit();
        checkIfActionAccountInitialized();

        await this.contract.methods
            .refillOrder(orderAddress, amount)
            .send(createTransactionOptions(transactionOptions));
    }
}

export type onOrderCreatedCallback = (address: string) => void;

export default OrdersFactory;
