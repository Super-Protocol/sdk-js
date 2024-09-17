import { parseBytes32String } from 'ethers/lib/utils.js';
import rootLogger from '../logger.js';
import {
  checkIfActionAccountInitialized,
  cleanWeb3Data,
  convertBigIntToString,
  incrementMethodCall,
} from '../utils/helper.js';
import {
  OrderInfo,
  OrderStatus,
  BlockInfo,
  TransactionOptions,
  OrderCreatedEvent,
  BlockchainId,
  TokenAmount,
  OrderSlots,
  OrderUsage,
  SlotInfo,
  SlotUsage,
  OptionInfo,
  orderInfoToRaw,
} from '../types/index.js';
import Superpro from './Superpro.js';
import TxManager from '../utils/TxManager.js';
import { BlockchainConnector, BlockchainEventsListener } from '../connectors/index.js';
import { Order } from '../models/index.js';
import { EventLog } from 'web3-eth-contract';
import StaticModel from './StaticModel.js';
import {
  WssSubscriptionOnDataFn,
  WssSubscriptionOnErrorFn,
} from '../connectors/BlockchainEventsListener.js';

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

  @incrementMethodCall()
  public static async createOrder(
    orderInfo: OrderInfo,
    slots: OrderSlots,
    deposit?: TokenAmount,
    suspended = false,
    transactionOptions?: TransactionOptions,
    checkTxBeforeSend = false,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);
    deposit = deposit ?? '0';
    const args = orderInfo.args;
    const orderInfoArguments = orderInfoToRaw(orderInfo);

    if (checkTxBeforeSend) {
      await TxManager.dryRun(
        contract.methods.createOrder(orderInfoArguments, slots, args, deposit, suspended),
        transactionOptions,
      );
    }

    await TxManager.execute(
      contract.methods.createOrder(orderInfoArguments, slots, args, deposit, suspended),
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

  @incrementMethodCall()
  public static async createWorkflow(
    parentOrderInfo: OrderInfo,
    parentOrderSlot: OrderSlots,
    subOrdersInfo: OrderInfo[],
    subOrdersSlots: OrderSlots[],
    workflowDeposit: TokenAmount,
    transactionOptions?: TransactionOptions,
    checkTxBeforeSend = false,
  ): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);
    workflowDeposit = workflowDeposit ?? '0';
    const parentArgs = parentOrderInfo.args;
    const parentOrderInfoArgs = orderInfoToRaw(parentOrderInfo);

    const subOrdersArgs = subOrdersInfo.map((i) => i.args);
    const subOrdersInfoArgs = subOrdersInfo.map((o) => orderInfoToRaw(o));

    if (checkTxBeforeSend) {
      await TxManager.dryRun(
        contract.methods.createWorkflow(
          parentOrderInfoArgs,
          parentOrderSlot,
          parentArgs,
          workflowDeposit,
          subOrdersInfoArgs,
          subOrdersSlots,
          subOrdersArgs,
        ),
        transactionOptions,
      );
    }

    await TxManager.execute(
      contract.methods.createWorkflow(
        parentOrderInfoArgs,
        parentOrderSlot,
        parentArgs,
        workflowDeposit,
        subOrdersInfoArgs,
        subOrdersSlots,
        subOrdersArgs,
      ),
      transactionOptions,
    );
  }

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
    amount: TokenAmount,
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
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOrderCreated' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      callback(
        <string>parsedEvent.consumer,
        parseBytes32String(<string>parsedEvent.externalId),
        <BlockchainId>parsedEvent.offerId,
        <BlockchainId>parsedEvent.parentOrderId,
        <BlockchainId>parsedEvent.orderId,
        <TokenAmount>parsedEvent.deposit,
        <OrderStatus>parsedEvent.status,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'OrderCreated',
    });
  }

  /**
   * Function for adding event listeners on order started event in orders contract
   * @param callback - function for processing suborder filled event
   * @param orderId - order id
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onStarted(callback: onOrderStartedCallback, orderId?: bigint): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOrderStarted' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (orderId && parsedEvent.orderId != convertBigIntToString(orderId)) {
        return;
      }
      callback(
        <BlockchainId>parsedEvent.orderId,
        <string>parsedEvent.consumer,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'OrderStarted',
    });
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
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOrdersStatusUpdated' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (orderId && parsedEvent.orderId != convertBigIntToString(orderId)) {
        return;
      }
      callback(
        <BlockchainId>parsedEvent.orderId,
        <OrderStatus>parsedEvent.status,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'OrderStatusUpdated',
    });
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
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOrderDepositRefilled' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (orderId && parsedEvent.orderId != convertBigIntToString(orderId)) {
        return;
      }
      if (consumer && parsedEvent.consumer != consumer) {
        return;
      }
      callback(
        <BlockchainId>parsedEvent.orderId,
        <string>parsedEvent.consumer,
        <TokenAmount>parsedEvent.amount,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'OrderDepositRefilled',
    });
  }

  /**
   * Function for adding event listeners on order changed withdrawn event in orders contract
   * @param callback - function for processing order changed withdrawn event
   * @param orderId - order id
   * @returns unsubscribe - unsubscribe function from event
   */
  public static onChangedWithdrawn(
    callback: onOrderChangeWithdrawnCallback,
    orderId?: BlockchainId,
  ): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOrderChangeWithdrawn' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (orderId && parsedEvent.orderId != convertBigIntToString(orderId)) {
        return;
      }
      callback(
        <BlockchainId>parsedEvent.orderId,
        <string>parsedEvent.consumer,
        <TokenAmount>parsedEvent.change,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'OrderChangeWithdrawn',
    });
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
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOrderProfitWithdrawn' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (orderId && parsedEvent.orderId != convertBigIntToString(orderId)) {
        return;
      }
      if (tokenReceiver && parsedEvent.tokenReceiver != tokenReceiver) {
        return;
      }
      callback(
        <BlockchainId>parsedEvent.orderId,
        <string>parsedEvent.tokenReceiver,
        <TokenAmount>parsedEvent.profit,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'OrderProfitWithdrawn',
    });
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
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOrderAwaitingPaymentChanged' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (orderId && parsedEvent.orderId != convertBigIntToString(orderId)) {
        return;
      }
      if (consumer && parsedEvent.consumer != consumer) {
        return;
      }
      callback(
        <BlockchainId>parsedEvent.orderId,
        <string>parsedEvent.consumer,
        <boolean>parsedEvent.awaitingPayment,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'OrderAwaitingPaymentChanged',
    });
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
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOrderEncryptedResultUpdated' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (orderId && parsedEvent.orderId != convertBigIntToString(orderId)) {
        return;
      }
      if (consumer && parsedEvent.consumer != consumer) {
        return;
      }
      callback(
        <BlockchainId>parsedEvent.orderId,
        <string>parsedEvent.consumer,
        <string>parsedEvent.encryptedResult,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'OrderEncryptedResultUpdated',
    });
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
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOrderOptionsDepositSpentChanged' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (orderId && parsedEvent.orderId != convertBigIntToString(orderId)) {
        return;
      }
      if (consumer && parsedEvent.consumer != consumer) {
        return;
      }
      callback(
        <string>parsedEvent.consumer,
        <BlockchainId>parsedEvent.orderId,
        <TokenAmount>parsedEvent.value,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'OrderOptionsDepositSpentChanged',
    });
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
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOrderProfitUnlocked' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      const parsedEvent = cleanWeb3Data(event.returnValues);
      if (orderId && parsedEvent.orderId != convertBigIntToString(orderId)) {
        return;
      }
      if (tokenReceiver && parsedEvent.tokenReceiver != tokenReceiver) {
        return;
      }
      callback(
        <string>parsedEvent.tokenReceiver,
        <BlockchainId>parsedEvent.orderId,
        <TokenAmount>parsedEvent.profit,
        <BlockInfo>{
          index: Number(event.blockNumber),
          hash: <string>event.blockHash,
        },
      );
    };
    const onError: WssSubscriptionOnErrorFn = (error: Error) => {
      logger.warn(error);
    };
    return listener.subscribeEvent({
      onError,
      onData,
      event: 'OrderProfitUnlocked',
    });
  }

  /**
   * Function that calculates resource needed for order
   * @param selectedUsage - structure that order.getSelectedUsage() method returns
   * @returns calculated resources
   */
  public static accumulatedSlotInfo(selectedUsage: OrderUsage): SlotInfo {
    const slotCount = selectedUsage.slotCount;
    const { cpuCores, ram, vram, diskUsage, gpuCores } = selectedUsage.slotInfo;

    return {
      cpuCores: cpuCores * slotCount,
      ram: ram * slotCount,
      diskUsage: diskUsage * slotCount,
      gpuCores: gpuCores * slotCount,
      vram: vram * slotCount,
    };
  }

  /**
   * Function that calculates total price for slot usage
   * @param selectedUsage - structure that order.getSelectedUsage() method returns
   * @returns slotUsage with totalPrices
   */
  public static accumulatedSlotUsage(selectedUsage: OrderUsage): SlotUsage {
    const slotCount = selectedUsage.slotCount;
    const slotUsage = selectedUsage.slotUsage;

    const totalPrice = BigInt(slotUsage.price) * BigInt(slotCount);

    return {
      priceType: slotUsage.priceType,
      price: totalPrice.toString(),
      minTimeMinutes: slotUsage.minTimeMinutes,
      maxTimeMinutes: slotUsage.maxTimeMinutes,
    };
  }

  /**
   * function that calculated requested options for order run
   * @param selectedUsage - structure that order.getSelectedUsage() method returns
   * @returns calculated options
   */
  public static accumulatedOptionsInfo(selectedUsage: OrderUsage): OptionInfo {
    return selectedUsage.optionInfo.reduce(
      (accumulatedInfo, optionInfo, optionInfoIndex) => {
        const { bandwidth, externalPort, traffic } = optionInfo;
        const optionCount = selectedUsage.optionsCount.at(optionInfoIndex) || 0;

        accumulatedInfo.bandwidth += bandwidth * optionCount;
        accumulatedInfo.externalPort += externalPort * optionCount;
        accumulatedInfo.traffic += traffic * optionCount;
        return accumulatedInfo;
      },
      {
        bandwidth: 0,
        externalPort: 0,
        traffic: 0,
      },
    );
  }
}

export type onOrderStartedCallback = (
  orderId: BlockchainId,
  consumer: string,
  block?: BlockInfo,
) => void;
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
  deposit: TokenAmount,
  orderStatus: OrderStatus,
  block?: BlockInfo,
) => void;
export type onOrderDepositRefilledCallback = (
  orderId: BlockchainId,
  consumer: string,
  amount: TokenAmount,
  block?: BlockInfo,
) => void;
export type onOrderChangeWithdrawnCallback = (
  orderId: BlockchainId,
  consumer: string,
  change: TokenAmount,
  block?: BlockInfo,
) => void;
export type onOrderProfitWithdrawnCallback = (
  orderId: BlockchainId,
  tokenReceiver: string,
  profit: TokenAmount,
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
  value: TokenAmount,
  block?: BlockInfo,
) => void;
export type onOrderProfitUnlockedCallback = (
  tokenReceiver: string,
  orderId: BlockchainId,
  profit: TokenAmount,
  block?: BlockInfo,
) => void;

export default Orders;
