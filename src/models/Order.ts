import {
    OrderInfo,
    OrderInfoStructure,
    OrderResult,
    OrderResultStructure,
    ExtendedOrderInfo,
    OrderStatus,
    SubOrderParams,
} from "../types/Order";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { ContractEvent, TransactionOptions } from "../types/Web3";
import { AbiItem } from "web3-utils";
import appJSON from "../contracts/app.json";
import store from "../store";
import { checkIfActionAccountInitialized, checkIfInitialized, objectToTuple, tupleToObject } from "../utils";
import { Origins, OriginsStructure } from "../types/Origins";
import { SubOrderCreatedEvent } from "../types/Events";
import { formatBytes32String } from "ethers/lib/utils";
import Superpro from "../staticModels/Superpro";
import TxManager from "../utils/TxManager";

class Order {
    private static contract: Contract;
    private logger: typeof rootLogger;

    public orderInfo?: OrderInfo;
    public orderResult?: OrderResult;
    public subOrders?: string[];
    public parentOrder?: string;
    public consumer?: string;
    public origins?: Origins;
    public startDate?: number;
    public id: string;

    constructor(orderId: string) {
        checkIfInitialized();

        this.id = orderId;
        if (!Order.contract) {
            Order.contract = new store.web3!.eth.Contract(<AbiItem[]>appJSON.abi, Superpro.address);
        }

        this.logger = rootLogger.child({ className: "Order", orderId: this.id });
    }

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private checkInitOrder(transactionOptions: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();

            return new transactionOptions.web3.eth.Contract(<AbiItem[]>appJSON.abi, Superpro.address);
        }
    }

    /**
     * Check if order exist
     */
    public async isExist(): Promise<boolean> {
        return await Order.contract.methods.isOrderValid(this.id).call();
    }

    /**
     * Function for fetching order info from blockchain
     */
    public async getOrderInfo(): Promise<OrderInfo> {
        const orderInfoParams = await Order.contract.methods.getOrder(this.id).call();

        return (this.orderInfo = tupleToObject(orderInfoParams[1], OrderInfoStructure));
    }

    public async getConsumer(): Promise<string> {
        const orderInfoParams = await Order.contract.methods.getOrder(this.id).call();
        this.consumer = orderInfoParams[0];
        return this.consumer!;
    }

    /**
     * Function for fetching order result from blockchain
     */
    public async getOrderResult(): Promise<OrderResult> {
        const orderInfoParams = await Order.contract.methods.getOrder(this.id).call();

        // for SDK compatibility
        const result = ["", "", orderInfoParams[2][1]];
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
        this.subOrders = await Order.contract.methods.getOrderSubOrders(this.id).call();
        return this.subOrders!;
    }

    /**
     * Function for fetching parent order from blockchain
     */
    public async getParentOrder(): Promise<string> {
        this.parentOrder = await Order.contract.methods.getOrderParentOrder(this.id).call();
        return this.parentOrder!;
    }

    /**
     * Function for fetching order deposit spent from blockchain
     */
    public async getDepositSpent(): Promise<string> {
        return Order.contract.methods.getDepositSpent(this.id).call();
    }

    /**
     * Fetch new Origins (createdDate, createdBy, modifiedDate and modifiedBy)
     */
    public async getOrigins(): Promise<Origins> {
        let origins = await Order.contract.methods.getOrderOrigins(this.id).call();

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
        return Order.contract.methods.getAwaitingPayment(this.id).call();
    }

    /**
     * Function for fetching start of processing date
     */
    public async getStartDate(): Promise<number> {
        return <number>Order.contract.methods.getStartDate(this.id).call();
    }

    /**
     * Function for fetching parent order from blockchain
     */
    public async setAwaitingPayment(value: boolean, transactionOptions?: TransactionOptions): Promise<void> {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(Order.contract.methods.setAwaitingPayment, [this.id, value], transactionOptions);
    }

    /**
     * Updates order price
     */
    public async updateOrderPrice(price: string, transactionOptions?: TransactionOptions): Promise<void> {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(Order.contract.methods.updateOrderPrice, [this.id, price], transactionOptions);
    }

    /**
     * Sets deposit spent
     */
    public async setDepositSpent(value: string, transactionOptions?: TransactionOptions): Promise<void> {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(Order.contract.methods.setDepositSpent, [this.id, value], transactionOptions);
    }

    /**
     * Function for updating status of contract
     */
    public async updateStatus(status: OrderStatus, price?: number, transactionOptions?: TransactionOptions) {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        if (status === OrderStatus.Processing) {
            await TxManager.execute(Order.contract.methods.processOrder, [this.id], transactionOptions);
        }

        if (this.orderInfo) this.orderInfo.status = status;
    }

    /**
     * Function for updating status of contract
     */
    public async cancelOrder(transactionOptions?: TransactionOptions) {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(Order.contract.methods.cancelOrder, [this.id], transactionOptions);
    }

    /**
     * Starts suspended order
     */
    public async start(transactionOptions?: TransactionOptions) {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(Order.contract.methods.startOrder, [this.id], transactionOptions);
    }

    /**
     * Updates order result
     */
    public async updateOrderResult(encryptedResult = "", transactionOptions?: TransactionOptions) {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(
            Order.contract.methods.updateOrderResult,
            [this.id, encryptedResult],
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
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(
            Order.contract.methods.completeOrder,
            [this.id, status, status === OrderStatus.Error ? encryptedError : encryptedResult],
            transactionOptions,
        );
    }

    /**
     * Function for creating sub orders for current order
     * @param subOrderInfo - order info for new subOrder
     * @param blocking - is sub order blocking
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     * @returns {Promise<void>} - Does not return id of created sub order!
     */
    public async createSubOrder(
        subOrderInfo: OrderInfo,
        blocking: boolean,
        externalId = "default",
        holdSum = '0',
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        const tupleSubOrder = objectToTuple(subOrderInfo, OrderInfoStructure);
        const formattedExternalId = formatBytes32String(externalId);
        const params: SubOrderParams = {
            blockParentOrder: blocking,
            externalId: formattedExternalId,
            holdSum,
        };
        await TxManager.execute(
            Order.contract.methods.createSubOrder,
            [this.id, tupleSubOrder, params],
            transactionOptions,
        );
    }

    /**
     * Function for creating pack of sub orders (wokflow) for current order
     * @param subOrdersInfo - orders info for new subOrders
     * @param transactionOptions - object what contains action account and web3 instance
     * @returns {Promise<string[]>} - tx hashes
     */
    public async createSubOrders(
        subOrdersInfo: ExtendedOrderInfo[],
        transactionOptions: TransactionOptions,
    ): Promise<string[]> {
        this.checkInitOrder(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        const batch = new transactionOptions.web3!.BatchRequest();
        const promises: any = subOrdersInfo.map((subOrderInfo) => {
            return new Promise((res, rej) => {
                const tupleSubOrder = objectToTuple(subOrderInfo, OrderInfoStructure);
                const formattedExternalId = formatBytes32String(subOrderInfo.externalId);
                const params: SubOrderParams = {
                    blockParentOrder: subOrderInfo.blocking,
                    externalId: formattedExternalId,
                    holdSum: subOrderInfo.holdSum,
                };

                const request = Order.contract.methods.createSubOrder(this.id, tupleSubOrder, params).send.request(
                    {
                        from: transactionOptions.from,
                        gasPrice: store.gasPrice,
                        gas: store.gasLimit,
                    },
                    (err: any, data: any) => {
                        if (data) res(data);
                        if (err) rej(err);
                    },
                );
                batch.add(request);
            });
        });

        batch.execute();
        const txs = await Promise.all(promises);

        return txs.reduce((a: any, b: any) => a.concat(b), []) as string[];
    }

    public async getSubOrder(consumer: string, externalId: string): Promise<SubOrderCreatedEvent> {
        const filter = {
            consumer,
            externalId: formatBytes32String(externalId),
        };
        const foundIds = await Order.contract.getPastEvents("SubOrderCreated", { filter });
        const notFound = { consumer, externalId, subOfferId: '-1', subOrderId: '-1', parentOrderId: '-1' };

        const response: SubOrderCreatedEvent =
            foundIds.length > 0 ? (foundIds[0].returnValues as SubOrderCreatedEvent) : notFound;

        return response;
    }

    /**
     * Function for withdrawing profit from order
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async withdrawProfit(transactionOptions?: TransactionOptions) {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(Order.contract.methods.withdrawProfit, [this.id], transactionOptions);
    }

    /**
     * Function for withdrawing change from order
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async withdrawChange(transactionOptions?: TransactionOptions) {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(Order.contract.methods.withdrawChange, [this.id], transactionOptions);
    }

    /**
     * Function for adding event listeners to contract events
     * @param callback - function for processing each order related with event
     * @return unsubscribe - function unsubscribing from event
     */
    public onOrderStatusUpdated(callback: onOrderStatusUpdatedCallback): () => void {
        const logger = this.logger.child({ method: "onOrderStatusUpdated" });

        const subscription = Order.contract.events
            .OrderStatusUpdated()
            .on("data", async (event: ContractEvent) => {
                if (event.returnValues.orderId != this.id) {
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
