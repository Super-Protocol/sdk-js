import { formatBytes32String, parseBytes32String } from 'ethers/lib/utils';
import rootLogger from '../logger';
import { checkIfActionAccountInitialized, incrementMethodCall } from '../utils/helper';
import { OrderInfo, OrderStatus, BlockInfo, TransactionOptions, OrderCreatedEvent, BlockchainId } from '../types';
import Superpro from './Superpro';
import TxManager from '../utils/TxManager';
import { BlockchainConnector, BlockchainEventsListener } from '../connectors';
import { Order } from '../models';
import { EventLog } from 'web3-eth-contract';
import StaticModel from './StaticModel';

class Orders implements StaticModel {
  private static readonly logger = rootLogger.child({ className: 'Orders' });

  public static orders?: BlockchainId[];

  public static get address(): string {
    return Superpro.address;
  }

  /**
   * Function for fetching list of all orders ids
   * @returns list of orders ids
   */
  public static async getAll(): Promise<BlockchainId[]> {
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
    filter: {
      externalId: string;
      consumer?: string;
    },
    fromBlock?: number | string,
    toBlock?: number | string,
  ): Promise<OrderCreatedEvent | null> {
    const founded = await StaticModel.findItemsById('OrderCreated', filter, fromBlock, toBlock);

    if (!founded) return null;

    return founded as OrderCreatedEvent;
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
      contract.methods.createWorkflow(parentOrderInfoArgs, workflowDeposit, subOrdersInfoArgs),
      transactionOptions,
    );
  }

  /**
   * Function for cancel workflow
   * @param parentOrderId - Parent order id
   * @returns {Promise<void>} - Does not return id of created order!
   */
  public static async cancelWorkflow(
    perentOrderId: BlockchainId,
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
    orderId: BlockchainId,
    amount: bigint,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(contract.methods.refillOrder(orderId, amount), transactionOptions);
  }

  public static async unlockProfitByOrderList(
    orderIds: BlockchainId[],
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    let executedCount: number;
    try {
      executedCount = Number(
        (await TxManager.dryRun(
          contract.methods.unlockProfitByList(orderIds),
          transactionOptions,
        )) as string,
      );
    } catch (e) {
      executedCount = 0;
    }

    if (executedCount === orderIds.length) {
      await TxManager.execute(contract.methods.unlockProfitByList(orderIds), transactionOptions);
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
        <BlockchainId>event.returnValues.offerId,
        <BlockchainId>event.returnValues.parentOrderId,
        <BlockchainId>event.returnValues.orderId,
        <BlockInfo>{
          index: <bigint>event.blockNumber,
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
        <BlockchainId>event.returnValues.orderId,
        <string>event.returnValues.consumer,
        <BlockInfo>{
          index: <bigint>event.blockNumber,
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
    orderId?: BlockchainId,
  ): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onOrdersStatusUpdated' });

    const subscription = contract.events.OrderStatusUpdated();
    subscription.on('data', (event: EventLog): void => {
      if (orderId && event.returnValues.orderId != BigInt(orderId)) {
        return;
      }
      callback(
        <BlockchainId>event.returnValues.orderId,
        <OrderStatus>event.returnValues.status?.toString(),
        <BlockInfo>{
          index: <bigint>event.blockNumber,
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
    orderId?: BlockchainId,
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
        <BlockchainId>event.returnValues.orderId,
        <string>event.returnValues.consumer,
        <bigint>event.returnValues.amount,
        <BlockInfo>{
          index: <bigint>event.blockNumber,
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
    orderId?: BlockchainId,
  ): () => void {
    const contract = BlockchainEventsListener.getInstance().getContract();
    const logger = this.logger.child({ method: 'onOrderChangedWithdrawn' });

    const subscription = contract.events.OrderChangedWithdrawn();
    subscription.on('data', (event: EventLog): void => {
      if (orderId && event.returnValues.orderId != orderId) {
        return;
      }
      callback(
        <BlockchainId>event.returnValues.orderId,
        <string>event.returnValues.consumer,
        <bigint>event.returnValues.change,
        <BlockInfo>{
          index: <bigint>event.blockNumber,
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
    orderId?: BlockchainId,
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
        <BlockchainId>event.returnValues.orderId,
        <string>event.returnValues.tokenReceiver,
        <bigint>event.returnValues.profit,
        <BlockInfo>{
          index: <bigint>event.blockNumber,
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
    orderId?: BlockchainId,
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
        <BlockchainId>event.returnValues.orderId,
        <string>event.returnValues.consumer,
        <boolean>event.returnValues.awaitingPayment,
        <BlockInfo>{
          index: <bigint>event.blockNumber,
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
    orderId?: BlockchainId,
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
        <BlockchainId>event.returnValues.orderId,
        <string>event.returnValues.consumer,
        <string>event.returnValues.encryptedResult,
        <BlockInfo>{
          index: <bigint>event.blockNumber,
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
    orderId?: BlockchainId,
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
        <BlockchainId>event.returnValues.orderId,
        <bigint>event.returnValues.value,
        <BlockInfo>{
          index: <bigint>event.blockNumber,
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
    orderId?: BlockchainId,
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
        <BlockchainId>event.returnValues.orderId,
        <bigint>event.returnValues.profit,
        <BlockInfo>{
          index: <bigint>event.blockNumber,
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

export type onOrderStartedCallback = (orderId: BlockchainId, consumer: string, block?: BlockInfo) => void;
export type onOrdersStatusUpdatedCallback = (
  orderId: BlockchainId,
  status: OrderStatus,
  block?: BlockInfo,
) => void;
export type onOrderCreatedCallback = (
  consumer: string,
  externalId: string,
  offerId: BlockchainId,
  parentOrderId: BlockchainId,
  orderId: BlockchainId,
  block?: BlockInfo,
) => void;
export type onOrderDepositRefilledCallback = (
  orderId: BlockchainId,
  consumer: string,
  amount: bigint,
  block?: BlockInfo,
) => void;
export type onOrderChangedWithdrawnCallback = (
  orderId: BlockchainId,
  consumer: string,
  change: bigint,
  block?: BlockInfo,
) => void;
export type onOrderProfitWithdrawnCallback = (
  orderId: BlockchainId,
  tokenReceiver: string,
  profit: bigint,
  block?: BlockInfo,
) => void;
export type onOrderAwaitingPaymentChangedCallback = (
  orderId: BlockchainId,
  consumer: string,
  awaitingPaymentFlag: boolean,
  block?: BlockInfo,
) => void;
export type onOrderEncryptedResultUpdatedCallback = (
  orderId: BlockchainId,
  consumer: string,
  encryptedResult: string,
  block?: BlockInfo,
) => void;
export type onOrderOptionsDepositSpentChangedCallback = (
  consumer: string,
  orderId: BlockchainId,
  value: bigint,
  block?: BlockInfo,
) => void;
export type onOrderProfitUnlockedCallback = (
  tokenReceiver: string,
  orderId: BlockchainId,
  profit: bigint,
  block?: BlockInfo,
) => void;

export default Orders;
