import { formatBytes32String, parseBytes32String } from 'ethers/lib/utils';
import rootLogger from '../logger';
import { checkIfActionAccountInitialized, incrementMethodCall } from '../utils/helper';
import { OrderInfo, OrderStatus, BlockInfo, TransactionOptions, OrderCreatedEvent } from '../types';
import Superpro from './Superpro';
import TxManager from '../utils/TxManager';
import { BlockchainConnector, BlockchainEventsListener } from '../connectors';
import { Order } from '../models';
import { EventLog } from 'web3-eth-contract';

class Orders {
    private static readonly logger = rootLogger.child({ className: 'Orders' });

    public static orders?: bigint[];

    public static get address(): string {
        return Superpro.address;
    }

    /**
     * Function for fetching list of all orders ids
     * @returns list of orders ids
     */
    public static async getAll(): Promise<bigint[]> {
        const contract = BlockchainConnector.getInstance().getContract();
        this.orders = this.orders ?? [];
        const ordersSet = new Set(this.orders);

        const ordersCount = Number(await contract.methods.getOrdersCount().call());
        for (let orderId = BigInt(ordersSet.size + 1); orderId <= ordersCount; orderId++) {
            ordersSet.add(orderId);
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
        deposit = BigInt('0'),
        suspended = false,
        transactionOptions?: TransactionOptions,
        checkTxBeforeSend = false,
    ): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract();
        checkIfActionAccountInitialized(transactionOptions);
        const orderInfoArguments = {
            ...orderInfo,
            externalId: formatBytes32String(orderInfo.externalId),
        };

        if (checkTxBeforeSend) {
            await TxManager.dryRun(
                contract.methods.createOrder(orderInfoArguments, deposit, suspended),
                transactionOptions,
            );
        }

        await TxManager.execute(
            contract.methods.createOrder(orderInfoArguments, deposit, suspended),
            transactionOptions,
        );
    }

    @incrementMethodCall()
    public static async getByExternalId(
        consumer = '',
        externalId = '',
        fromBlock?: number | string,
        toBlock?: number | string,
    ): Promise<OrderCreatedEvent> {
        const contract = BlockchainConnector.getInstance().getContract();

        const filter = {
            consumer,
            externalId: formatBytes32String(externalId),
        };
        const options: any = { filter };

        if (fromBlock) options.fromBlock = fromBlock;
        if (toBlock) options.toBlock = toBlock;

        const foundIds = await contract.getPastEvents('OrderCreated', options);
        const notFound = {
            ...filter,
            offerId: '-1',
            parentOrderId: '-1',
            orderId: '-1',
        };

        const response: OrderCreatedEvent =
            foundIds.length > 0
                ? ((foundIds[0] as EventLog).returnValues as OrderCreatedEvent)
                : notFound;

        response.externalId = parseBytes32String(response.externalId);

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
        workflowDeposit = '0',
        transactionOptions?: TransactionOptions,
        checkTxBeforeSend = false,
    ): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract();
        checkIfActionAccountInitialized(transactionOptions);

        const parentOrderInfoArgs = {
            ...parentOrderInfo,
            externalId: formatBytes32String(parentOrderInfo.externalId),
        };

        const subOrdersInfoArgs = subOrdersInfo.map((o) => ({
            ...o,
            externalId: formatBytes32String(o.externalId),
        }));

        if (checkTxBeforeSend) {
            await TxManager.dryRun(
                contract.methods.createWorkflow(parentOrderInfoArgs, workflowDeposit, subOrdersInfoArgs),
                transactionOptions,
            );
        }

        await TxManager.execute(
            contract.methods.createWorkflow(
                parentOrderInfoArgs,
                workflowDeposit,
                subOrdersInfoArgs,
            ),
            transactionOptions,
        );
    }

    /**
     * Function for cancel workflow
     * @param parentOrderId - Parent order id
     * @returns {Promise<void>} - Does not return id of created order!
     */
    public static async cancelWorkflow(
        perentOrderId: bigint,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract();
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(contract.methods.cancelWorkflow(perentOrderId), transactionOptions);
    }

    /**
     * Function for refilling order deposit
     * @param orderId - order id
     * @param amount - amount of tokens to refilling
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async refillOrderDeposit(
        orderId: bigint,
        amount: bigint,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract();
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(contract.methods.refillOrder(orderId, amount), transactionOptions);
    }

    public static async unlockProfitByOrderList(
        orderIds: bigint[],
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract();
        checkIfActionAccountInitialized(transactionOptions);

        let executedCount;
        try {
            executedCount = +(await TxManager.dryRun(
                contract.methods.unlockProfitByList(orderIds),
                transactionOptions,
            ));
        } catch (e) {
            executedCount = 0;
        }

        if (executedCount === orderIds.length) {
            await TxManager.execute(
                contract.methods.unlockProfitByList(orderIds),
                transactionOptions,
            );
        } else {
            for (const orderId of orderIds) {
                await new Order(orderId).unlockProfit();
            }
        }
    }

    /**
     * Function for adding event listeners on order created event in orders factory contract
     * @param callback - function for processing created order
     * @returns unsubscribe - unsubscribe function from event
     */
    public static onCreated(callback: onOrderCreatedCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: 'onOrderCreated' });

        const subscription = contract.events.OrderCreated();
        subscription.on('data', (event: EventLog): void => {
            callback(
                <string>event.returnValues.consumer,
                parseBytes32String(<string>event.returnValues.externalId),
                <bigint>event.returnValues.offerId,
                <bigint>event.returnValues.parentOrderId,
                <bigint>event.returnValues.orderId,
                <BlockInfo>{
                    index: <number>event.blockNumber,
                    hash: <string>event.blockHash,
                },
            );
        });
        subscription.on('error', (error: Error) => {
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
    public static onStarted(callback: onOrderStartedCallback, orderId?: bigint): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: 'onOrderStarted' });

        const subscription = contract.events.OrderStarted();
        subscription.on('data', (event: EventLog): void => {
            if (orderId && event.returnValues.orderId != orderId) {
                return;
            }
            callback(
                <bigint>event.returnValues.orderId,
                <string>event.returnValues.consumer,
                <BlockInfo>{
                    index: <number>event.blockNumber,
                    hash: <string>event.blockHash,
                },
            );
        });
        subscription.on('error', (error: Error) => {
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
    public static onStatusUpdated(
        callback: onOrdersStatusUpdatedCallback,
        orderId?: bigint,
    ): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: 'onOrdersStatusUpdated' });

        const subscription = contract.events.OrderStatusUpdated();
        subscription.on('data', (event: EventLog): void => {
            if (orderId && event.returnValues.orderId != orderId) {
                return;
            }
            callback(
                <bigint>event.returnValues.orderId,
                <OrderStatus>event.returnValues.status,
                <BlockInfo>{
                    index: <number>event.blockNumber,
                    hash: <string>event.blockHash,
                },
            );
        });
        subscription.on('error', (error: Error) => {
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
        orderId?: bigint,
    ): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: 'onOrderDepositRefilled' });

        const subscription = contract.events.OrderDepositRefilled();
        subscription.on('data', (event: EventLog): void => {
            if (orderId && event.returnValues.orderId != orderId) {
                return;
            }
            if (consumer && event.returnValues.consumer != consumer) {
                return;
            }
            callback(
                <bigint>event.returnValues.orderId,
                <string>event.returnValues.consumer,
                <bigint>event.returnValues.amount,
                <BlockInfo>{
                    index: <number>event.blockNumber,
                    hash: <string>event.blockHash,
                },
            );
        });
        subscription.on('error', (error: Error) => {
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
    public static onChangedWithdrawn(
        callback: onOrderChangedWithdrawnCallback,
        orderId?: bigint,
    ): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: 'onOrderChangedWithdrawn' });

        const subscription = contract.events.OrderChangedWithdrawn();
        subscription.on('data', (event: EventLog): void => {
            if (orderId && event.returnValues.orderId != orderId) {
                return;
            }
            callback(
                <bigint>event.returnValues.orderId,
                <string>event.returnValues.consumer,
                <bigint>event.returnValues.change,
                <BlockInfo>{
                    index: <number>event.blockNumber,
                    hash: <string>event.blockHash,
                },
            );
        });
        subscription.on('error', (error: Error) => {
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
        orderId?: bigint,
        tokenReceiver?: string,
    ): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: 'onOrderProfitWithdrawn' });

        const subscription = contract.events.OrderProfitWithdrawn();
        subscription.on('data', (event: EventLog): void => {
            if (orderId && event.returnValues.orderId != orderId) {
                return;
            }
            if (tokenReceiver && event.returnValues.tokenReceiver != tokenReceiver) {
                return;
            }
            callback(
                <bigint>event.returnValues.orderId,
                <string>event.returnValues.tokenReceiver,
                <bigint>event.returnValues.profit,
                <BlockInfo>{
                    index: <number>event.blockNumber,
                    hash: <string>event.blockHash,
                },
            );
        });
        subscription.on('error', (error: Error) => {
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
        orderId?: bigint,
    ): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: 'onOrderAwaitingPaymentChanged' });

        const subscription = contract.events.OrderAwaitingPaymentChanged();
        subscription.on('data', (event: EventLog): void => {
            if (orderId && event.returnValues.orderId != orderId) {
                return;
            }
            if (consumer && event.returnValues.consumer != consumer) {
                return;
            }
            callback(
                <bigint>event.returnValues.orderId,
                <string>event.returnValues.consumer,
                <boolean>event.returnValues.awaitingPayment,
                <BlockInfo>{
                    index: <number>event.blockNumber,
                    hash: <string>event.blockHash,
                },
            );
        });
        subscription.on('error', (error: Error) => {
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
        orderId?: bigint,
    ): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: 'onOrderEncryptedResultUpdated' });

        const subscription = contract.events.OrderEncryptedResultUpdated();
        subscription.on('data', (event: EventLog): void => {
            if (orderId && event.returnValues.orderId != orderId) {
                return;
            }
            if (consumer && event.returnValues.consumer != consumer) {
                return;
            }
            callback(
                <bigint>event.returnValues.orderId,
                <string>event.returnValues.consumer,
                <string>event.returnValues.encryptedResult,
                <BlockInfo>{
                    index: <number>event.blockNumber,
                    hash: <string>event.blockHash,
                },
            );
        });
        subscription.on('error', (error: Error) => {
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
        orderId?: bigint,
    ): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: 'onOrderOptionsDepositSpentChanged' });

        const subscription = contract.events.OrderOptionsDepositSpentChanged();
        subscription.on('data', (event: EventLog): void => {
            if (orderId && event.returnValues.orderId != orderId) {
                return;
            }
            if (consumer && event.returnValues.consumer != consumer) {
                return;
            }
            callback(
                <string>event.returnValues.consumer,
                <bigint>event.returnValues.orderId,
                <bigint>event.returnValues.value,
                <BlockInfo>{
                    index: <number>event.blockNumber,
                    hash: <string>event.blockHash,
                },
            );
        });
        subscription.on('error', (error: Error) => {
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
        orderId?: bigint,
    ): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: 'onOrderProfitUnlocked' });

        const subscription = contract.events.OrderProfitUnlocked();
        subscription.on('data', (event: EventLog): void => {
            if (orderId && event.returnValues.orderId != orderId) {
                return;
            }
            if (tokenReceiver && event.returnValues.tokenReceiver != tokenReceiver) {
                return;
            }
            callback(
                <string>event.returnValues.tokenReceiver,
                <bigint>event.returnValues.orderId,
                <bigint>event.returnValues.profit,
                <BlockInfo>{
                    index: <number>event.blockNumber,
                    hash: <string>event.blockHash,
                },
            );
        });
        subscription.on('error', (error: Error) => {
            logger.warn(error);
        });

        return () => subscription.unsubscribe();
    }
}

export type onOrderStartedCallback = (orderId: bigint, consumer: string, block?: BlockInfo) => void;
export type onOrdersStatusUpdatedCallback = (
    orderId: bigint,
    status: OrderStatus,
    block?: BlockInfo,
) => void;
export type onOrderCreatedCallback = (
    consumer: string,
    externalId: string,
    offerId: bigint,
    parentOrderId: bigint,
    orderId: bigint,
    block?: BlockInfo,
) => void;
export type onOrderDepositRefilledCallback = (
    orderId: bigint,
    consumer: string,
    amount: bigint,
    block?: BlockInfo,
) => void;
export type onOrderChangedWithdrawnCallback = (
    orderId: bigint,
    consumer: string,
    change: bigint,
    block?: BlockInfo,
) => void;
export type onOrderProfitWithdrawnCallback = (
    orderId: bigint,
    tokenReceiver: string,
    profit: bigint,
    block?: BlockInfo,
) => void;
export type onOrderAwaitingPaymentChangedCallback = (
    orderId: bigint,
    consumer: string,
    awaitingPaymentFlag: boolean,
    block?: BlockInfo,
) => void;
export type onOrderEncryptedResultUpdatedCallback = (
    orderId: bigint,
    consumer: string,
    encryptedResult: string,
    block?: BlockInfo,
) => void;
export type onOrderOptionsDepositSpentChangedCallback = (
    consumer: string,
    orderId: bigint,
    value: bigint,
    block?: BlockInfo,
) => void;
export type onOrderProfitUnlockedCallback = (
    tokenReceiver: string,
    orderId: bigint,
    profit: bigint,
    block?: BlockInfo,
) => void;

export default Orders;
