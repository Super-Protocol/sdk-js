import {
    OrderInfo,
    OrderInfoStructure,
    OrderResult,
    OrderResultStructure,
    ExtendedOrderInfo,
    OrderStatus,
    SubOrderParams,
    OrderUsage,
    OrderUsageStructure,
} from '../types/Order';
import { Contract } from 'web3-eth-contract';
import rootLogger from '../logger';
import { ContractEvent, TransactionOptions } from '../types/Web3';
import { AbiItem } from 'web3-utils';
import appJSON from '../contracts/app.json';
import store from '../store';
import {
    checkIfActionAccountInitialized,
    incrementMethodCall,
    objectToTuple,
    tupleToObject,
    unpackSlotInfo,
} from '../utils';
import { Origins, OriginsStructure } from '../types/Origins';
import { formatBytes32String } from 'ethers/lib/utils';
import BlockchainConnector from '../connectors/BlockchainConnector';
import Superpro from '../staticModels/Superpro';
import TxManager from '../utils/TxManager';
import BlockchainEventsListener from '../connectors/BlockchainEventsListener';
import TeeOffers from '../staticModels/TeeOffers';
import { tryWithInterval } from '../utils/helpers';
import { BLOCKCHAIN_CALL_RETRY_INTERVAL, BLOCKCHAIN_CALL_RETRY_ATTEMPTS } from '../constants';

class Order {
    private static contract: Contract;
    private logger: typeof rootLogger;

    public selectedUsage?: OrderUsage;
    public orderInfo?: OrderInfo;
    public orderResult?: OrderResult;
    public subOrders?: string[];
    public parentOrder?: string;
    public consumer?: string;
    public origins?: Origins;
    public startDate?: number;
    public id: string;

    constructor(orderId: string) {
        this.id = orderId;
        if (!Order.contract) {
            Order.contract = BlockchainConnector.getInstance().getContract();
        }

        this.logger = rootLogger.child({ className: 'Order', orderId: this.id });
    }

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private checkInitOrder(transactionOptions: TransactionOptions) {
        if (transactionOptions?.web3) {
            return new transactionOptions.web3.eth.Contract(
                <AbiItem[]>appJSON.abi,
                Superpro.address,
            );
        }
    }

    /**
     * Check if order exist
     */
    public async isExist(): Promise<boolean> {
        return await Order.contract.methods.isOrderValid(this.id).call();
    }

    /**
     * Check if order is in `processing` state
     */
    public async isOrderProcessing(): Promise<boolean> {
        return await Order.contract.methods.isOrderProcessing(this.id).call();
    }

    /**
     * Function for fetching avaliable for unlock order profit.
     */
    public async isOrderProfitAvailable(): Promise<string> {
        const [, profit] = await Order.contract.methods.isOrderProfitAvailable(this.id).call();

        return profit;
    }

    /**
     * Function for fetching order price
     */
    public async calculateCurrentPrice(): Promise<string> {
        return await Order.contract.methods.calculateOrderCurrentPrice(this.id).call();
    }

    /**
     * Function for fetching order info from blockchain
     */
    @incrementMethodCall()
    public async getOrderInfo(): Promise<OrderInfo> {
        if (!(await this.checkIfOrderExistsWithInterval())) {
            throw Error(`Order ${this.id} does not exist`);
        }
        const orderInfoParams = await Order.contract.methods.getOrder(this.id).call();

        return (this.orderInfo = tupleToObject(orderInfoParams[1], OrderInfoStructure));
    }

    private async checkIfOrderExistsWithInterval(): Promise<boolean> {
        const offerExists = await tryWithInterval({
            handler: () => this.isExist(),
            checkResult: (exists) => {
                if (!exists) this.logger.debug(`Order ${this.id} exists: ${exists}`);

                return { isResultOk: exists };
            },
            retryInterval: BLOCKCHAIN_CALL_RETRY_INTERVAL,
            retryMax: BLOCKCHAIN_CALL_RETRY_ATTEMPTS,
        });

        return offerExists;
    }

    @incrementMethodCall()
    public async getConsumer(): Promise<string> {
        const orderInfoParams = await Order.contract.methods.getOrder(this.id).call();
        this.consumer = orderInfoParams[0];

        return this.consumer!;
    }

    /**
     * Function for fetching order result from blockchain
     */
    @incrementMethodCall()
    public async getOrderResult(): Promise<OrderResult> {
        const orderInfoParams = await Order.contract.methods.getOrder(this.id).call();

        return (this.orderResult = tupleToObject(
            [orderInfoParams[2][0], orderInfoParams[2][1]],
            OrderResultStructure,
        ));
    }

    /**
     * Function for fetching sub orders from blockchain
     */
    @incrementMethodCall()
    public async getSubOrders(): Promise<string[]> {
        this.subOrders = await Order.contract.methods.getOrderSubOrders(this.id).call();

        return this.subOrders!;
    }

    /**
     * Function for fetching parent order from blockchain
     */
    @incrementMethodCall()
    public async getParentOrder(): Promise<string> {
        this.parentOrder = await Order.contract.methods.getOrderParentOrder(this.id).call();

        return this.parentOrder!;
    }

    /**
     * Function for fetching order options deposit spent from blockchain
     */
    @incrementMethodCall()
    public async getOptionsDepositSpent(): Promise<string> {
        return Order.contract.methods.getOptionsDepositSpent(this.id).call();
    }

    /**
     * Function for fetching order deposit spent from blockchain
     */
    @incrementMethodCall()
    public async getSelectedUsage(): Promise<OrderUsage> {
        this.selectedUsage = tupleToObject(
            await Order.contract.methods.getOrderSelectedUsage(this.id).call(),
            OrderUsageStructure,
        );
        this.selectedUsage.optionsCount = this.selectedUsage.optionsCount.map((item) => +item);
        this.selectedUsage.slotInfo = unpackSlotInfo(
            this.selectedUsage.slotInfo,
            await TeeOffers.getDenominator(),
        );

        return this.selectedUsage;
    }

    /**
     * Function for fetching hold deposits sum of the order and its suborders
     */
    @incrementMethodCall()
    public async calculateTotalOrderDeposit(): Promise<string> {
        return Order.contract.methods.calculateTotalOrderDeposit(this.id).call();
    }

    /**
     * Function for fetching reserve for output order
     */
    @incrementMethodCall()
    public async calculateOrderOutputReserve(): Promise<string> {
        return Order.contract.methods.calculateOrderOutputReserve(this.id).call();
    }

    /**
     * Function for fetching spent deposits sum of the order and its suborders
     */
    @incrementMethodCall()
    public async calculateTotalDepositSpent(): Promise<string> {
        return Order.contract.methods.calculateTotalDepositSpent(this.id).call();
    }

    /**
     * Function for fetching unspent deposits sum of the order and its suborders
     */
    @incrementMethodCall()
    public async calculateTotalDepositUnspent(): Promise<string> {
        return Order.contract.methods.calculateTotalDepositUnspent(this.id).call();
    }

    /**
     * Fetch new Origins (createdDate, createdBy, modifiedDate and modifiedBy)
     */
    @incrementMethodCall()
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
    @incrementMethodCall()
    public async getAwaitingPayment(): Promise<boolean> {
        return Order.contract.methods.getAwaitingPayment(this.id).call();
    }

    /**
     * Function for fetching deposit of order from blockchain
     */
    @incrementMethodCall()
    public async getDeposit(): Promise<string> {
        return Order.contract.methods.getOrderDeposit(this.id).call();
    }

    /**
     * Function for fetching start of processing date
     */
    @incrementMethodCall()
    public async getStartDate(): Promise<number> {
        return <number>Order.contract.methods.getStartDate(this.id).call();
    }

    /**
     * Function for fetching parent order from blockchain
     */
    @incrementMethodCall()
    public async setAwaitingPayment(
        value: boolean,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(
            Order.contract.methods.setAwaitingPayment,
            [this.id, value],
            transactionOptions,
        );
    }

    /**
     * Updates order price
     */
    @incrementMethodCall()
    public async updateOrderPrice(
        price: string,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(
            Order.contract.methods.updateOrderPrice,
            [this.id, price],
            transactionOptions,
        );
    }

    /**
     * Sets options deposit spent
     */
    @incrementMethodCall()
    public async setOptionsDepositSpent(
        value: string,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(
            Order.contract.methods.setOptionsDepositSpent,
            [this.id, value],
            transactionOptions,
        );
    }

    /**
     * Function for updating status of contract
     */
    @incrementMethodCall()
    public async updateStatus(status: OrderStatus, transactionOptions?: TransactionOptions) {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        if (status === OrderStatus.Processing) {
            await TxManager.execute(
                Order.contract.methods.processOrder,
                [this.id],
                transactionOptions,
            );
        }

        if (this.orderInfo) this.orderInfo.status = status;
    }

    /**
     * Function for updating status of contract
     */
    @incrementMethodCall()
    public async cancelOrder(transactionOptions?: TransactionOptions) {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(Order.contract.methods.cancelOrder, [this.id], transactionOptions);
    }

    /**
     * Starts suspended order
     */
    @incrementMethodCall()
    public async start(transactionOptions?: TransactionOptions) {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(Order.contract.methods.startOrder, [this.id], transactionOptions);
    }

    /**
     * Updates order result
     */
    @incrementMethodCall()
    public async updateOrderResult(encryptedResult = '', transactionOptions?: TransactionOptions) {
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
    @incrementMethodCall()
    public async complete(
        status: OrderStatus,
        encryptedResult = '',
        transactionOptions?: TransactionOptions,
    ) {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(
            Order.contract.methods.completeOrder,
            [this.id, status, encryptedResult],
            transactionOptions,
        );
    }

    /**
     * Unlocks profit
     */
    @incrementMethodCall()
    public async unlockProfit(transactionOptions?: TransactionOptions) {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(Order.contract.methods.unlockProfit, [this.id], transactionOptions);
    }

    /**
     * Function for creating sub orders for current order
     * @param subOrderInfo - order info for new subOrder
     * @param blockParentOrder - is sub order blocking
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     * @returns Promise<void> - Does not return id of created sub order!
     */
    @incrementMethodCall()
    public async createSubOrder(
        subOrderInfo: OrderInfo,
        blockParentOrder: boolean,
        deposit = '0',
        transactionOptions?: TransactionOptions,
        checkTxBeforeSend = false,
    ): Promise<void> {
        transactionOptions ?? this.checkInitOrder(transactionOptions!);
        checkIfActionAccountInitialized(transactionOptions);

        const preparedInfo = {
            ...subOrderInfo,
            externalId: formatBytes32String(subOrderInfo.externalId),
        };
        const tupleSubOrder = objectToTuple(preparedInfo, OrderInfoStructure);
        const params: SubOrderParams = {
            blockParentOrder,
            deposit,
        };

        if (checkTxBeforeSend) {
            await TxManager.dryRun(
                Order.contract.methods.createSubOrder,
                [this.id, tupleSubOrder, params],
                transactionOptions,
            );
        }

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
    @incrementMethodCall()
    public async createSubOrders(
        subOrdersInfo: ExtendedOrderInfo[],
        transactionOptions: TransactionOptions,
    ): Promise<string[]> {
        this.checkInitOrder(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        const batch = new transactionOptions.web3!.BatchRequest();
        const promises: any = subOrdersInfo.map((subOrderInfo) => {
            return new Promise((res, rej) => {
                const preparedInfo = {
                    ...subOrderInfo,
                    externalId: formatBytes32String(subOrderInfo.externalId),
                };
                const tupleSubOrder = objectToTuple(preparedInfo, OrderInfoStructure);
                const params: SubOrderParams = {
                    blockParentOrder: subOrderInfo.blocking,
                    deposit: subOrderInfo.deposit,
                };

                const request = Order.contract.methods
                    .createSubOrder(this.id, tupleSubOrder, params)
                    .send.request(
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

    /**
     * Function for adding event listeners to contract events
     * @param callback - function for processing each order related with event
     * @returns unsubscribe - function unsubscribing from event
     */
    public onStatusUpdated(callback: onOrderStatusUpdatedCallback): () => void {
        const logger = this.logger.child({ method: 'onOrderStatusUpdated' });

        // TODO: add ability to use this event without https provider initialization
        const contractWss = BlockchainEventsListener.getInstance().getContract();
        const subscription = contractWss.events
            .OrderStatusUpdated()
            .on('data', async (event: ContractEvent) => {
                if (event.returnValues.orderId != this.id) {
                    return;
                }
                if (this.orderInfo) this.orderInfo.status = <OrderStatus>event.returnValues.status;
                callback(<OrderStatus>event.returnValues.status);
            })
            .on('error', (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }
}

export type onOrderStatusUpdatedCallback = (status: OrderStatus) => void;

export default Order;
