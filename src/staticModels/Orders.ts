import rootLogger from "../logger";
import { checkIfActionAccountInitialized, incrementMethodCall, objectToTuple } from "../utils";
import { OrderInfo, OrderInfoStructure, OrderInfoStructureArray, OrderStatus } from "../types/Order";
import { formatBytes32String, parseBytes32String } from "ethers/lib/utils";
import { BlockInfo, ContractEvent, TransactionOptions } from "../types/Web3";
import { OrderCreatedEvent } from "../types/Events";
import Superpro from "./Superpro";
import TxManager from "../utils/TxManager";
import BlockchainConnector from "../connectors/BlockchainConnector";
import BlockchainEventsListener from "../connectors/BlockchainEventsListener";

class Orders {
    private static readonly logger = rootLogger.child({ className: "Orders" });

    public static orders?: string[];

    public static get address(): string {
        return Superpro.address;
    }

    /**
     * Function for fetching list of all orders ids
     * @returns list of orders ids
     */
    public static async getAll(): Promise<string[]> {
        const contract = BlockchainConnector.getInstance().getContract();
        this.orders = this.orders ?? [];
        const ordersSet = new Set(this.orders);

        const ordersCount = await contract.methods.getOrdersCount().call();
        for (let orderId = ordersSet.size + 1; orderId <= ordersCount; orderId++) {
            ordersSet.add(orderId.toString());
        }
        this.orders = Array.from(ordersSet);

        return this.orders;
    }

    /**
     * Function for fetching orders count
     */
    public static async getCount(): Promise<number> {
        const contract = BlockchainConnector.getInstance().getContract();

        return Number(await contract.methods.getOrdersCount().call());
    }

    /**
     * Function for creating orders
     * @param orderInfo - order info for new order
     * @param suspended - is orders suspended
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     * @returns {Promise<void>} - Does not return id of created order!
     */
    @incrementMethodCall()
    public static async createOrder(
        orderInfo: OrderInfo,
        deposit = "0",
        suspended = false,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);
        const preparedInfo = {
            ...orderInfo,
            externalId: formatBytes32String(orderInfo.externalId),
        };
        const orderInfoArguments = objectToTuple(preparedInfo, OrderInfoStructure);

        await TxManager.execute(
            contract.methods.createOrder,
            [orderInfoArguments, deposit, suspended],
            transactionOptions,
        );
    }

    @incrementMethodCall()
    public static async getByExternalId(consumer: string, externalId: string): Promise<OrderCreatedEvent> {
        const contract = BlockchainConnector.getInstance().getContract();
        const filter = {
            consumer,
            externalId: formatBytes32String(externalId),
        };
        const foundIds = await contract.getPastEvents("OrderCreated", { filter });
        const notFound = {
            consumer,
            externalId,
            offerId: "-1",
            parentOrderId: "-1",
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
    @incrementMethodCall()
    public static async createWorkflow(
        parentOrderInfo: OrderInfo,
        subOrdersInfo: OrderInfo[],
        workflowDeposit = "0",
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        const preparedInfo = {
            ...parentOrderInfo,
            externalId: formatBytes32String(parentOrderInfo.externalId),
        };
        const parentOrderInfoArgs = objectToTuple(preparedInfo, OrderInfoStructure);

        const preparedSubOrdersInfo = subOrdersInfo.map((o) => ({
            ...o,
            externalId: formatBytes32String(o.externalId),
        }));
        const subOrdersInfoArgs = objectToTuple(preparedSubOrdersInfo, OrderInfoStructureArray);

        await TxManager.execute(
            contract.methods.createWorkflow,
            [parentOrderInfoArgs, workflowDeposit, subOrdersInfoArgs],
            transactionOptions,
        );
    }

    /**
     * Function for cancel workflow
     * @param parentOrderId - Parent order id
     * @returns {Promise<void>} - Does not return id of created order!
     */
    public static async cancelWorkflow(perentOrderId: string, transactionOptions?: TransactionOptions): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(contract.methods.cancelWorkflow, [perentOrderId], transactionOptions);
    }

    /**
     * Function for withdraw workflow change
     * @param parentOrderId - Parent order id
     * @returns {Promise<void>} - Does not return id of created order!
     */
    public static async withdrawWorkflowChange(
        parentOrderId: string,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(contract.methods.withdrawWorkflowChange, [parentOrderId], transactionOptions);
    }

    /**
     * Function for refilling order deposit
     * @param orderId - order id
     * @param amount - amount of tokens to refilling
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async refillOrderDeposit(orderId: string, amount: string, transactionOptions?: TransactionOptions) {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(contract.methods.refillOrder, [orderId, amount], transactionOptions);
    }

    /**
     * Function for adding event listeners on order created event in orders factory contract
     * @param callback - function for processing created order
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onCreated(callback: onOrderCreatedCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onOrderCreated" });

        const subscription = contract.events
            .OrderCreated()
            .on("data", async (event: ContractEvent) => {
                //consumer: string, externalId: string, offerId: string, orderId: string
                callback(
                    <string>event.returnValues.consumer,
                    parseBytes32String(<string>event.returnValues.externalId),
                    <string>event.returnValues.offerId,
                    <string>event.returnValues.parentOrderId,
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
     * Function for adding event listeners on order started event in orders contract
     * @param callback - function for processing suborder filled event
     * @param orderId - order id
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onStarted(callback: onOrderStartedCallback, orderId?: string): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onOrderStarted" });

        const subscription = contract.events
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
    public static onStatusUpdated(callback: onOrdersStatusUpdatedCallback, orderId?: string): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onOrdersStatusUpdated" });

        const subscription = contract.events
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
    public static onDepositRefilled(
        callback: onOrderDepositRefilledCallback,
        consumer?: string,
        orderId?: string,
    ): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onOrderDepositRefilled" });

        const subscription = contract.events
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
     * Function for adding event listeners on order changed withdrawn event in orders contract
     * @param callback - function for processing order changed withdrawn event
     * @param orderId - order id
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onChangedWithdrawn(callback: onOrderChangedWithdrawnCallback, orderId?: string): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onOrderChangedWithdrawn" });

        const subscription = contract.events
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
    public static onProfitWithdrawn(
        callback: onOrderProfitWithdrawnCallback,
        orderId?: string,
        tokenReceiver?: string,
    ): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onOrderProfitWithdrawn" });

        const subscription = contract.events
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
    public static onAwaitingPaymentChanged(
        callback: onOrderAwaitingPaymentChangedCallback,
        consumer?: string,
        orderId?: string,
    ): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onOrderAwaitingPaymentChanged" });

        const subscription = contract.events
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
     * Function for adding event listeners on order encrypted result updated event in orders contract
     * @param callback - function for processing order encrypted result updated event
     * @param consumer - order creator address
     * @param orderId - order id
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onEncryptedResultUpdated(
        callback: onOrderEncryptedResultUpdatedCallback,
        consumer?: string,
        orderId?: string,
    ): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onOrderEncryptedResultUpdated" });

        const subscription = contract.events
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

    /**
     * Function for adding event listeners on OrderOptionsDepositSpentChanged event in orders contract
     * @param callback - function for processing order encrypted result updated event
     * @param consumer - order creator address
     * @param orderId - order id
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onOptionsDepositSpentChanged(
        callback: onOrderOptionsDepositSpentChangedCallback,
        consumer?: string,
        orderId?: string,
    ): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onOrderOptionsDepositSpentChanged" });

        const subscription = contract.events
            .OrderOptionsDepositSpentChanged()
            .on("data", async (event: ContractEvent) => {
                if (orderId && event.returnValues.orderId != orderId) {
                    return;
                }
                if (consumer && event.returnValues.consumer != consumer) {
                    return;
                }
                callback(
                    <string>event.returnValues.consumer,
                    <string>event.returnValues.orderId,
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
     * Function for adding event listeners on onOrderProfitUnlocked event in orders contract
     * @param callback - function for processing order encrypted result updated event
     * @param tokenReceiver - tokenReceiver
     * @param orderId - order id
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onOProfitUnlocked(
        callback: onOrderProfitUnlockedCallback,
        tokenReceiver?: string,
        orderId?: string,
    ): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onOrderProfitUnlocked" });

        const subscription = contract.events
            .OrderProfitUnlocked()
            .on("data", async (event: ContractEvent) => {
                if (orderId && event.returnValues.orderId != orderId) {
                    return;
                }
                if (tokenReceiver && event.returnValues.tokenReceiver != tokenReceiver) {
                    return;
                }
                callback(
                    <string>event.returnValues.tokenReceiver,
                    <string>event.returnValues.orderId,
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
}

export type onOrderStartedCallback = (orderId: string, consumer: string, block?: BlockInfo) => void;
export type onOrdersStatusUpdatedCallback = (orderId: string, status: OrderStatus, block?: BlockInfo) => void;
export type onOrderCreatedCallback = (
    consumer: string,
    externalId: string,
    offerId: string,
    parentOrderId: string,
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
export type onOrderOptionsDepositSpentChangedCallback = (
    consumer: string,
    orderId: string,
    value: string,
    block?: BlockInfo,
) => void;
export type onOrderProfitUnlockedCallback = (
    tokenReceiver: string,
    orderId: string,
    profit: string,
    block?: BlockInfo,
) => void;

export default Orders;
