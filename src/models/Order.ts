import { OrderInfo, OrderInfoArguments, OrderResult, OrderResultArguments, OrderStatus } from "../types/Order";
import { Contract } from "web3-eth-contract";
import _ from "lodash";
import rootLogger from "../logger";
import {ContractEvent, TransactionOptions} from "../types/Web3";
import { AbiItem } from "web3-utils";
import OrderJSON from "../contracts/Order.json";
import store from "../store";
import {checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions} from "../utils";

class Order {
    public address: string;
    private contract: Contract;
    private logger: typeof rootLogger;

    public orderInfo?: OrderInfo;
    public orderResult?: OrderResult;
    public subOrders?: string[];
    public parentOrder?: string;
    public consumer?: string;

    constructor(address: string) {
        checkIfInitialized();

        this.address = address;
        this.contract = new store.web3!.eth.Contract(<AbiItem[]>OrderJSON.abi, address);

        this.logger = rootLogger.child({ className: "Order", address });
    }

    /**
     * Function for fetching order info from blockchain
     */
    public async getOrderInfo(): Promise<OrderInfo> {
        const orderInfoParams = await this.contract.methods.getOrderInfo().call();
        return (this.orderInfo = <OrderInfo>_.zipObject(OrderInfoArguments, orderInfoParams));
    }

    public async getConsumer(): Promise<string> {
        this.consumer = await this.contract.methods.getConsumer().call();
        return this.consumer!;
    }

    /**
     * Function for fetching order result from blockchain
     */
    public async getOrderResult(): Promise<OrderResult> {
        const orderResultParams = await this.contract.methods.getOrderResult().call();
        return (this.orderResult = <OrderResult>_.zipObject(OrderResultArguments, orderResultParams));
    }

    /**
     * Function for fetching sub orders from blockchain
     */
    public async getSubOrders(): Promise<string[]> {
        this.subOrders = await this.contract.methods.getSubOrders().call();
        return this.subOrders!;
    }

    /**
     * Function for fetching parent order from blockchain
     */
    public async getParentOrder(): Promise<string> {
        this.parentOrder = await this.contract.methods.getParentOrder().call();
        return this.parentOrder!;
    }

    /**
     * Function for updating status of contract
     */
    public async updateStatus(status: OrderStatus, price: number, transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        await this.contract.methods
            .updateStatus(status, price)
            .send(createTransactionOptions(transactionOptions));

        if (this.orderInfo) this.orderInfo.status = status;
    }

    /**
     * Function for updating status of contract
     */
    public async cancelOrder(transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        await this.contract.methods
            .cancelOrder()
            .send(createTransactionOptions(transactionOptions));
    }

    /**
     * Function for creating sub orders for current order
     * @param subOrderInfo - order info for new subOrder
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     * @returns Promise<void> - Does not return address of created contract!
     */
    public async createSubOrder(subOrderInfo: OrderInfo, transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        // Convert order info to array (used in blockchain)
        const subOrderInfoArguments = _.at(subOrderInfo, OrderInfoArguments);

        await this.contract.methods
            .createSubOrder(subOrderInfoArguments)
            .send(createTransactionOptions(transactionOptions));
    }

    /**
     * Function for withdrawing profit from order
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async withdrawProfit(transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        await this.contract.methods
            .withdrawProfit()
            .send(createTransactionOptions(transactionOptions));
    }

    /**
     * Function for withdrawing change from order
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async withdrawChange(transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        await this.contract.methods
            .withdrawChange()
            .send(createTransactionOptions(transactionOptions));
    }

    /**
     * Function for adding event listeners to contract events
     * @param callback - function for processing each order related with event
     * @return unsubscribe - function unsubscribing from event
     */
    public onOrderStatusUpdated(callback: onOrderStatusUpdatedCallback): () => void {
        const logger = this.logger.child({ method: "onOrderStatusUpdated" });

        let subscription = this.contract.events
            .OrderStatusUpdated()
            .on("data", async (event: ContractEvent) => {
                if (this.orderInfo) this.orderInfo.status = <OrderStatus>event.returnValues.status;
                callback(<OrderStatus>event.returnValues.status);
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }
}

export type onOrderStatusUpdatedCallback = (status: OrderStatus) => void;

export default Order;
