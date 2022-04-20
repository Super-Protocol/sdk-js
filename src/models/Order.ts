import { OrderInfo, OrderInfoStructure, OrderResult, OrderResultStructure, OrderStatus } from "../types/Order";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { ContractEvent, TransactionOptions } from "../types/Web3";
import { AbiItem } from "web3-utils";
import OrdersJSON from "../contracts/Orders.json";
import store from "../store";
import {
    checkIfActionAccountInitialized,
    checkIfInitialized,
    createTransactionOptions,
    objectToTuple,
    tupleToObject,
} from "../utils";
import { Origins, OriginsStructure } from "../types/Origins";
import { SubOrderCreatedEvent } from "../types/Events";
import { formatBytes32String } from "ethers/lib/utils";
import Superpro from "../staticModels/Superpro";

class Order {
    private contract: Contract;
    private logger: typeof rootLogger;

    public orderInfo?: OrderInfo;
    public orderResult?: OrderResult;
    public subOrders?: string[];
    public parentOrder?: string;
    public consumer?: string;
    public origins?: Origins;
    public orderId: number;

    constructor(orderId: string) {
        checkIfInitialized();

        this.orderId = +orderId;
        this.contract = new store.web3!.eth.Contract(<AbiItem[]>OrdersJSON.abi, Superpro.address);

        this.logger = rootLogger.child({ className: "Order", orderId: this.orderId });
    }

    /**
     * Function for fetching order info from blockchain
     */
    public async getOrderInfo(): Promise<OrderInfo> {
        const orderInfoParams = await this.contract.methods.getOrder().call();

        return (this.orderInfo = tupleToObject(orderInfoParams[1], OrderInfoStructure));
    }

    public async getConsumer(): Promise<string> {
        const orderInfoParams = await this.contract.methods.getOrder().call();
        this.consumer = orderInfoParams[0];
        return this.consumer!;
    }

    /**
     * Function for fetching order result from blockchain
     */
    public async getOrderResult(): Promise<OrderResult> {
        const orderInfoParams = await this.contract.methods.getOrder().call();
        this.orderResult = orderInfoParams[2];
        return this.orderResult = tupleToObject(orderInfoParams[2], OrderResultStructure);
    }

    /**
     * Function for fetching sub orders from blockchain
     */
    public async getSubOrders(): Promise<string[]> {
        this.subOrders = await this.contract.methods.getOrderSubOrders(this.orderId).call();
        return this.subOrders!;
    }

    /**
     * Function for fetching parent order from blockchain
     */
    public async getParentOrder(): Promise<string> {
        this.parentOrder = await this.contract.methods.getOrderParentOrder(this.orderId).call();
        return this.parentOrder!;
    }

    /**
     * Fetch new Origins (createdDate, createdBy, modifiedDate and modifiedBy)
     */
    public async getOrigins(): Promise<Origins> {
        let origins = await this.contract.methods.getOrderOrigins(this.orderId).call();

        // Converts blockchain array into object
        origins = tupleToObject(origins, OriginsStructure);

        // Convert blockchain time seconds to js time milliseconds
        origins.createdDate = +origins.createdDate * 1000;
        origins.modifiedDate = +origins.modifiedDate * 1000;

        return (this.origins = origins);
    }

    /**
     * Function for updating status of contract
     */
    public async updateStatus(status: OrderStatus, price: number, transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        if (status === OrderStatus.Processing) {
            await this.contract.methods
                .processOrder(this.orderId)
                .send(await createTransactionOptions(transactionOptions));
        }

        if (status === OrderStatus.AwaitingPayment) {
            await this.contract.methods
                .updateStatus(this.orderId, price)
                .send(await createTransactionOptions(transactionOptions));
        }

        if (this.orderInfo) this.orderInfo.status = status;
    }

    /**
     * Function for updating status of contract
     */
    public async cancelOrder(transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        await this.contract.methods.cancelOrder(this.orderId).send(await createTransactionOptions(transactionOptions));
    }

    /**
     * Starts suspended order
     */
    public async start(transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        await this.contract.methods.startOrder(this.orderId).send(await createTransactionOptions(transactionOptions));
    }

    /**
     * Completes order
     */
    public async complete(
        status: OrderStatus,
        encryptedResult = "",
        encryptedError = "",
        transactionOptions?: TransactionOptions,
    ) {
        checkIfActionAccountInitialized();

        await this.contract.methods
            .completeOrder(this.orderId, status, encryptedResult, encryptedError)
            .send(await createTransactionOptions(transactionOptions));
    }

    /**
     * Function for creating sub orders for current order
     * @param subOrderInfo - order info for new subOrder
     * @param blocking - is sub order blocking
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     * @returns {Promise<void>} - Does not return address of created contract!
     */
    public async createSubOrder(
        subOrderInfo: OrderInfo,
        blocking: boolean,
        externalId = formatBytes32String("default"),
        transactionOptions?: TransactionOptions,
    ) {
        checkIfActionAccountInitialized();

        const tupleSubOrder = objectToTuple(subOrderInfo, OrderInfoStructure);
        await this.contract.methods
            .createSubOrder(this.orderId, tupleSubOrder, blocking, externalId)
            .send(await createTransactionOptions(transactionOptions));
    }

    public async getSubOrder(consumer: string, externalId: string): Promise<SubOrderCreatedEvent> {
        const filter = {
            consumer,
            externalId: formatBytes32String(externalId),
        };
        const foundIds = await this.contract.getPastEvents("SubOrderCreated", { filter });
        const notFound = { consumer, externalId, subOfferId: -1, subOrderId: -1, parentOrderId: -1 };

        const response: SubOrderCreatedEvent =
            foundIds.length > 0 ? (foundIds[0].returnValues as SubOrderCreatedEvent) : notFound;

        return response;
    }

    /**
     * Function for withdrawing profit from order
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async withdrawProfit(transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        await this.contract.methods
            .withdrawProfit(this.orderId)
            .send(await createTransactionOptions(transactionOptions));
    }

    /**
     * Function for withdrawing change from order
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async withdrawChange(transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        await this.contract.methods
            .withdrawChange(this.orderId)
            .send(await createTransactionOptions(transactionOptions));
    }

    /**
     * Function for adding event listeners to contract events
     * @param callback - function for processing each order related with event
     * @return unsubscribe - function unsubscribing from event
     */
    public onOrderStatusUpdated(callback: onOrderStatusUpdatedCallback): () => void {
        const logger = this.logger.child({ method: "onOrderStatusUpdated" });

        const subscription = this.contract.events
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
