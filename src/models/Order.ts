import {
    OrderInfo,
    OrderInfoStructure,
    OrderResult,
    OrderResultStructure,
    OrderStatus,
    SubOrderParams,
} from "../types/Order";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { ContractEvent, TransactionOptions } from "../types/Web3";
import { AbiItem } from "web3-utils";
import OrdersJSON from "../contracts/Orders.json";
import store from "../store";
import { checkIfActionAccountInitialized, checkIfInitialized, objectToTuple, tupleToObject } from "../utils";
import { Origins, OriginsStructure } from "../types/Origins";
import { SubOrderCreatedEvent } from "../types/Events";
import { formatBytes32String } from "ethers/lib/utils";
import Superpro from "../staticModels/Superpro";
import Model from "../utils/Model";

class Order extends Model {
    private contract: Contract;
    private logger: typeof rootLogger;

    public orderInfo?: OrderInfo;
    public orderResult?: OrderResult;
    public subOrders?: string[];
    public parentOrder?: string;
    public consumer?: string;
    public origins?: Origins;
    public orderId: number;
    public address: string;

    constructor(orderId: string) {
        super();
        checkIfInitialized();

        this.orderId = +orderId;
        this.address = orderId;
        this.contract = new store.web3!.eth.Contract(<AbiItem[]>OrdersJSON.abi, Superpro.address);

        this.logger = rootLogger.child({ className: "Order", orderId: this.orderId });
    }

    /**
     * Check if order exist
     */
    public async isExist(): Promise<boolean> {
        return await this.contract.methods.isOrderValid(this.orderId).call();
    }

    /**
     * Function for fetching order info from blockchain
     */
    public async getOrderInfo(): Promise<OrderInfo> {
        const orderInfoParams = await this.contract.methods.getOrder(this.orderId).call();

        return (this.orderInfo = tupleToObject(orderInfoParams[1], OrderInfoStructure));
    }

    public async getConsumer(): Promise<string> {
        const orderInfoParams = await this.contract.methods.getOrder(this.orderId).call();
        this.consumer = orderInfoParams[0];
        return this.consumer!;
    }

    /**
     * Function for fetching order result from blockchain
     */
    public async getOrderResult(): Promise<OrderResult> {
        const orderInfoParams = await this.contract.methods.getOrder(this.orderId).call();

        // for SDK compatibility
        const result = ['', '', orderInfoParams[2][1]];
        if (orderInfoParams[1][4] === OrderStatus.Error)
            result[1] = orderInfoParams[2][0];
        else
            result[0] = orderInfoParams[2][0];

        return this.orderResult = tupleToObject(result, OrderResultStructure);
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
     * Function for fetching order deposit spent from blockchain
     */
    public async getDepositSpent(): Promise<string> {
        return this.contract.methods.getDepositSpent(this.orderId).call();
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
     * Function for fetching parent order from blockchain
     */
    public async getAwaitingPayment(): Promise<boolean> {
        return this.contract.methods.getAwaitingPayment(this.orderId).call();
    }

    /**
     * Function for fetching parent order from blockchain
     */
    public async setAwaitingPayment(value: boolean, transactionOptions?: TransactionOptions): Promise<void> {
        checkIfActionAccountInitialized(transactionOptions);

        await Order.execute(this.contract.methods.setAwaitingPayment, [this.orderId, value], transactionOptions);
    }

    /**
     * Updates order price
     */
    public async updateOrderPrice(price: string, transactionOptions?: TransactionOptions): Promise<void> {
        checkIfActionAccountInitialized(transactionOptions);

        await Order.execute(this.contract.methods.updateOrderPrice, [this.orderId, price], transactionOptions);
    }

    /**
     * Sets deposit spent
     */
    public async setDepositSpent(value: string, transactionOptions?: TransactionOptions): Promise<void> {
        checkIfActionAccountInitialized(transactionOptions);

        await Order.execute(this.contract.methods.setDepositSpent, [this.orderId, value], transactionOptions);
    }

    /**
     * Function for updating status of contract
     */
    public async updateStatus(status: OrderStatus, price?: number, transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized(transactionOptions);

        if (status === OrderStatus.Processing) {
            await Order.execute(this.contract.methods.processOrder, [this.orderId], transactionOptions);
        }

        if (this.orderInfo) this.orderInfo.status = status;
    }

    /**
     * Function for updating status of contract
     */
    public async cancelOrder(transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized(transactionOptions);

        await Order.execute(this.contract.methods.cancelOrder, [this.orderId], transactionOptions);
    }

    /**
     * Starts suspended order
     */
    public async start(transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized(transactionOptions);

        await Order.execute(this.contract.methods.startOrder, [this.orderId], transactionOptions);
    }

    /**
     * Updates order result
     */
    public async updateOrderResult(encryptedResult = "", transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized(transactionOptions);

        await Order.execute(
            this.contract.methods.updateOrderResult,
            [this.orderId, encryptedResult],
            transactionOptions,
        );
    }

    /**
     * Completes order
     */
    public async complete(
        status: OrderStatus,
        encryptedResult = "",
        encryptedError = "", // for SDK compatibility
        transactionOptions?: TransactionOptions,
    ) {
        checkIfActionAccountInitialized(transactionOptions);

        await Order.execute(
            this.contract.methods.completeOrder,
            [this.orderId, status, status === OrderStatus.Error ? encryptedError : encryptedResult],
            transactionOptions,
        );
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
        externalId = "default",
        holdSum: number = 0,
        transactionOptions?: TransactionOptions,
    ) {
        checkIfActionAccountInitialized(transactionOptions);

        const tupleSubOrder = objectToTuple(subOrderInfo, OrderInfoStructure);
        const formattedExternalId = formatBytes32String(externalId);
        const params: SubOrderParams = {
            blockParentOrder: blocking,
            externalId: formattedExternalId,
            holdSum,
        };
        await Order.execute(
            this.contract.methods.createSubOrder,
            [this.orderId, tupleSubOrder, params],
            transactionOptions,
        );
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
        checkIfActionAccountInitialized(transactionOptions);

        await Order.execute(this.contract.methods.withdrawProfit, [this.orderId], transactionOptions);
    }

    /**
     * Function for withdrawing change from order
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async withdrawChange(transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized(transactionOptions);

        await Order.execute(this.contract.methods.withdrawChange, [this.orderId], transactionOptions);
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
                if (event.returnValues.orderId != this.orderId) {
                    return;
                }
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
