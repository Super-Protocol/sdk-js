import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import appJSON from "../contracts/app.json";
import { checkIfActionAccountInitialized, checkIfInitialized, objectToTuple } from "../utils";
import { OrderInfo, OrderInfoStructure, OrderInfoStructureArray, OrderStatus } from "../types/Order";
import { formatBytes32String, parseBytes32String } from "ethers/lib/utils";
import { BlockInfo, ContractEvent, TransactionOptions } from "../types/Web3";
import { OrderCreatedEvent } from "../types/Events";
import Superpro from "./Superpro";
import TxManager from "../utils/TxManager";

class OrdersFactory {
    private static contract: Contract;
    private static activeOrders: Contract;
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

            return new transactionOptions.web3.eth.Contract(<AbiItem[]>appJSON.abi, Superpro.address);
        }

        if (this.contract) return this.contract;
        checkIfInitialized();

        this.logger = rootLogger.child({
            className: "OrdersFactory",
            address: Superpro.address,
        });

        return (this.contract = new store.web3!.eth.Contract(<AbiItem[]>appJSON.abi, Superpro.address));
    }

    /**
     * Function for fetching list of all orders ids
     * @returns list of orders ids
     */
    public static async getAllOrders(): Promise<string[]> {
        this.checkInit();
        this.orders = this.orders ?? [];
        const ordersSet = new Set(this.orders);

        const ordersCount = await this.contract.methods.getOrdersCount().call();
        for (let orderId = ordersSet.size + 1; orderId <= ordersCount; orderId++) {
            ordersSet.add(orderId.toString());
        }
        this.orders = Array.from(ordersSet);

        return this.orders;
    }

    /**
     * Function for fetching orders count
     */
    public static async getOrdersCount(): Promise<number> {
        this.checkInit();

        return Number(await this.contract.methods.getOrdersCount().call());
    }

    /**
     * Function for fetching order hold deposit for specific order
     * @param orderId - order for fetching hold deposit
     */
    public static async getOrderHoldDeposit(orderId: string): Promise<string> {
        this.checkInit();

        return await this.contract.methods.getOrderHoldDeposit(orderId).call();
    }

    /**
     * Function for creating orders
     * @param orderInfo - order info for new order
     * @param suspended - is orders suspended
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     * @returns {Promise<void>} - Does not return id of created order!
     */
    public static async createOrder(
        orderInfo: OrderInfo,
        holdDeposit = "0",
        suspended = false,
        externalId = "default",
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = this.checkInit(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        const orderInfoArguments = objectToTuple(orderInfo, OrderInfoStructure);
        const formattedExternalId = formatBytes32String(externalId);
        await TxManager.execute(
            contract.methods.createOrder,
            [orderInfoArguments, holdDeposit, suspended, formattedExternalId],
            transactionOptions,
        );
    }

    public static async getOrder(consumer: string, externalId: string): Promise<OrderCreatedEvent> {
        const contract = this.checkInit();
        const filter = {
            consumer,
            externalId: formatBytes32String(externalId),
        };
        const foundIds = await contract.getPastEvents("OrderCreated", { filter });
        const notFound = {
            consumer,
            externalId,
            offerId: "-1",
            orderId: "-1",
        };

        const response: OrderCreatedEvent =
            foundIds.length > 0 ? (foundIds[0].returnValues as OrderCreatedEvent) : notFound;

        return response;
    }

    /**
     * Function for create workflow
     * @param parentOrderInfo - order info for new order
     * @param subOrdersInfo - array of sub orders infos
     * @param externalId - external id
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     * @returns {Promise<void>} - Does not return id of created order!
     */
    public static async createWorkflow(
        perentOrderInfo: OrderInfo,
        subOrdersInfo: OrderInfo[],
        holdDeposit = "0",
        externalId = "default",
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = this.checkInit(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        const perentOrderInfoArgs = objectToTuple(perentOrderInfo, OrderInfoStructure);
        const formattedExternalId = formatBytes32String(externalId);
        const subOrdersInfoArgs = objectToTuple(subOrdersInfo, OrderInfoStructureArray);
        await TxManager.execute(
            contract.methods.createWorkflow,
            [perentOrderInfoArgs, holdDeposit, formattedExternalId, subOrdersInfoArgs],
            transactionOptions,
        );
    }

    /**
     * Function for refilling order deposit
     * @param orderId - order id
     * @param amount - amount of tokens to refilling
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async refillOrderDeposit(orderId: string, amount: string, transactionOptions?: TransactionOptions) {
        const contract = this.checkInit(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(contract.methods.refillOrder, [orderId, amount], transactionOptions);
    }

    /**
     * Function for adding event listeners on order created event in orders factory contract
     * @param callback - function for processing created order
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onWorkflowCreated(callback: onWorkflowCreatedCallback): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onWorkflowCreated" });

        const subscription = this.contract.events
            .WorkflowCreated()
            .on("data", async (event: ContractEvent) => {
                //consumer: string, externalId: string, offerId: string, orderId: string
                callback(
                    <string>event.returnValues.consumer,
                    parseBytes32String(<string>event.returnValues.externalId),
                    <string>event.returnValues.offerId,
                    <string>event.returnValues.orderId,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for adding event listeners on order created event in orders factory contract
     * @param callback - function for processing created order
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onOrderCreated(callback: onOrderCreatedCallback): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onOrderCreated" });

        const subscription = this.contract.events
            .OrderCreated()
            .on("data", async (event: ContractEvent) => {
                //consumer: string, externalId: string, offerId: string, orderId: string
                callback(
                    <string>event.returnValues.consumer,
                    parseBytes32String(<string>event.returnValues.externalId),
                    <string>event.returnValues.offerId,
                    <string>event.returnValues.orderId,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for adding event listeners on suborder created event in orders contract
     * @param callback - function for processing created suborder
     * @param parentOrderId - parent order id
     * @return unsubscribe - unsubscribe function from event
     */
    public static onSubOrderCreated(callback: onSubOrderCreatedCallback, parentOrderId?: string): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onSubOrderCreated" });

        const subscription = this.contract.events
            .SubOrderCreated()
            .on("data", async (event: ContractEvent) => {
                if (parentOrderId && event.returnValues.parentOrderId != parentOrderId) {
                    return;
                }
                callback(
                    <string>event.returnValues.parentOrderId,
                    <string>event.returnValues.subOrderId,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for adding event listeners on order started event in orders contract
     * @param callback - function for processing suborder filled event
     * @param orderId - order id
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onOrderStarted(callback: onOrderStartedCallback, orderId?: string): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onOrderStarted" });

        const subscription = this.contract.events
            .OrderStarted()
            .on("data", async (event: ContractEvent) => {
                if (orderId && event.returnValues.orderId != orderId) {
                    return;
                }
                callback(
                    <string>event.returnValues.orderId,
                    <string>event.returnValues.consumer,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for adding event listeners on order updated status event in orders contract
     * @param callback - function for processing order updated status event
     * @param orderId - order id
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onOrdersStatusUpdated(callback: onOrdersStatusUpdatedCallback, orderId?: string): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onOrdersStatusUpdated" });

        const subscription = this.contract.events
            .OrderStatusUpdated()
            .on("data", async (event: ContractEvent) => {
                if (orderId && event.returnValues.orderId != orderId) {
                    return;
                }
                callback(
                    <string>event.returnValues.orderId,
                    <OrderStatus>event.returnValues.status,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for adding event listeners on order refilled event in orders contract
     * @param callback - function for processing order refilled event
     * @param consumer - consumer address
     * @param orderId - order id
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onOrderDepositRefilled(
        callback: onOrderDepositRefilledCallback,
        consumer?: string,
        orderId?: string,
    ): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onOrderDepositRefilled" });

        const subscription = this.contract.events
            .OrderDepositRefilled()
            .on("data", async (event: ContractEvent) => {
                if (orderId && event.returnValues.orderId != orderId) {
                    return;
                }
                if (consumer && event.returnValues.consumer != consumer) {
                    return;
                }
                callback(
                    <string>event.returnValues.orderId,
                    <string>event.returnValues.consumer,
                    <string>event.returnValues.amount,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for adding event listeners on order price updated event in orders contract
     * @param callback - function for processing order price updated event
     * @param orderId - order id
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onOrderPriceUpdated(callback: onOrderPriceUpdatedCallback, orderId?: string): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onOrderPriceUpdated" });

        const subscription = this.contract.events
            .OrderPriceUpdated()
            .on("data", async (event: ContractEvent) => {
                if (orderId && event.returnValues.orderId != orderId) {
                    return;
                }
                callback(
                    <string>event.returnValues.orderId,
                    <string>event.returnValues.price,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for adding event listeners on order changed withdrawn event in orders contract
     * @param callback - function for processing order changed withdrawn event
     * @param orderId - order id
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onOrderChangedWithdrawn(callback: onOrderChangedWithdrawnCallback, orderId?: string): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onOrderChangedWithdrawn" });

        const subscription = this.contract.events
            .OrderChangedWithdrawn()
            .on("data", async (event: ContractEvent) => {
                if (orderId && event.returnValues.orderId != orderId) {
                    return;
                }
                callback(
                    <string>event.returnValues.orderId,
                    <string>event.returnValues.consumer,
                    <string>event.returnValues.change,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for adding event listeners on order changed refunded event in orders contract
     * @param callback - function for processing order changed refunded event
     * @param tokenReceiver - token receiver address
     * @param orderId - order id
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onOrderProfitWithdrawn(
        callback: onOrderProfitWithdrawnCallback,
        orderId?: string,
        tokenReceiver?: string,
    ): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onOrderProfitWithdrawn" });

        const subscription = this.contract.events
            .OrderProfitWithdrawn()
            .on("data", async (event: ContractEvent) => {
                if (orderId && event.returnValues.orderId != orderId) {
                    return;
                }
                if (tokenReceiver && event.returnValues.tokenReceiver != tokenReceiver) {
                    return;
                }
                callback(
                    <string>event.returnValues.orderId,
                    <string>event.returnValues.tokenReceiver,
                    <string>event.returnValues.profit,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for adding event listeners on order awaiting payment event in orders contract
     * @param callback - function for processing order awaiting payment event
     * @param consumer - order creator address
     * @param orderId - order id
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onOrderAwaitingPaymentChanged(
        callback: onOrderAwaitingPaymentChangedCallback,
        consumer?: string,
        orderId?: string,
    ): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onOrderAwaitingPaymentChanged" });

        const subscription = this.contract.events
            .OrderAwaitingPaymentChanged()
            .on("data", async (event: ContractEvent) => {
                if (orderId && event.returnValues.orderId != orderId) {
                    return;
                }
                if (consumer && event.returnValues.consumer != consumer) {
                    return;
                }
                callback(
                    <string>event.returnValues.orderId,
                    <string>event.returnValues.consumer,
                    <boolean>event.returnValues.awaitingPayment,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for adding event listeners on order deposit spent event in orders contract
     * @param callback - function for processing order deposit spent event
     * @param consumer - order creator address
     * @param orderId - order id
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onOrderDepositSpentChanged(
        callback: onOrderDepositSpentChangedCallback,
        consumer?: string,
        orderId?: string,
    ): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onOrderDepositSpentChanged" });

        const subscription = this.contract.events
            .OrderDepositSpentChanged()
            .on("data", async (event: ContractEvent) => {
                if (orderId && event.returnValues.orderId != orderId) {
                    return;
                }
                if (consumer && event.returnValues.consumer != consumer) {
                    return;
                }
                callback(
                    <string>event.returnValues.orderId,
                    <string>event.returnValues.consumer,
                    <string>event.returnValues.value,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for adding event listeners on order encrypted result updated event in orders contract
     * @param callback - function for processing order encrypted result updated event
     * @param consumer - order creator address
     * @param orderId - order id
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onOrderEncryptedResultUpdated(
        callback: onOrderEncryptedResultUpdatedCallback,
        consumer?: string,
        orderId?: string,
    ): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onOrderEncryptedResultUpdated" });

        const subscription = this.contract.events
            .OrderEncryptedResultUpdated()
            .on("data", async (event: ContractEvent) => {
                if (orderId && event.returnValues.orderId != orderId) {
                    return;
                }
                if (consumer && event.returnValues.consumer != consumer) {
                    return;
                }
                callback(
                    <string>event.returnValues.orderId,
                    <string>event.returnValues.consumer,
                    <string>event.returnValues.encryptedResult,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }
}

export type onSubOrderCreatedCallback = (parentOrderId: string, subOrderId: string, block?: BlockInfo) => void;
export type onOrderStartedCallback = (orderId: string, consumer: string, block?: BlockInfo) => void;
export type onOrdersStatusUpdatedCallback = (orderId: string, status: OrderStatus, block?: BlockInfo) => void;
export type onOrderPriceUpdatedCallback = (orderId: string, price: string, block?: BlockInfo) => void;
export type onOrderCreatedCallback = (
    consumer: string,
    externalId: string,
    offerId: string,
    orderId: string,
    block?: BlockInfo,
) => void;
export type onOrderDepositRefilledCallback = (
    orderId: string,
    consumer: string,
    amount: string,
    block?: BlockInfo,
) => void;
export type onOrderChangedWithdrawnCallback = (
    orderId: string,
    consumer: string,
    change: string,
    block?: BlockInfo,
) => void;
export type onOrderProfitWithdrawnCallback = (
    orderId: string,
    tokenReceiver: string,
    profit: string,
    block?: BlockInfo,
) => void;
export type onOrderDepositSpentChangedCallback = (
    orderId: string,
    consumer: string,
    spent: string,
    block?: BlockInfo,
) => void;
export type onOrderAwaitingPaymentChangedCallback = (
    orderId: string,
    consumer: string,
    awaitingPaymentFlag: boolean,
    block?: BlockInfo,
) => void;
export type onOrderEncryptedResultUpdatedCallback = (
    orderId: string,
    consumer: string,
    encryptedResult: string,
    block?: BlockInfo,
) => void;
export type onWorkflowCreatedCallback = (
    consumer: string,
    externalId: string,
    offerId: string,
    orderId: string,
    block?: BlockInfo,
) => void;

export default OrdersFactory;
