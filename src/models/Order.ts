import {
  OrderInfo,
  OrderResult,
  ExtendedOrderInfo,
  OrderStatus,
  SubOrderParams,
  OrderUsage,
  Origins,
  TransactionOptions,
  BlockchainId,
  OrderArgs,
  TokenAmount,
  SlotInfo,
  SlotUsage,
  OrderUsageRaw,
  OrderSlots,
  orderInfoFromRaw,
  orderInfoToRaw,
  OrderInfoRaw,
} from '../types';
import { Contract, TransactionReceipt } from 'web3';
import { EventLog } from 'web3-eth-contract';
import rootLogger from '../logger';
import { abi } from '../contracts/abi';
import {
  checkIfActionAccountInitialized,
  cleanWeb3Data,
  convertOrderUsage,
  formatUsage,
  incrementMethodCall,
  unpackSlotInfo,
} from '../utils/helper';
import { BlockchainConnector, BlockchainEventsListener } from '../connectors';
import TeeOffers from '../staticModels/TeeOffers';
import TxManager from '../utils/TxManager';
import { tryWithInterval } from '../utils/helpers';
import { BLOCKCHAIN_CALL_RETRY_INTERVAL, BLOCKCHAIN_CALL_RETRY_ATTEMPTS } from '../constants';

class Order {
  private static contract: Contract<typeof abi>;
  private logger: typeof rootLogger;

  public selectedUsage?: OrderUsage;
  public orderInfo?: OrderInfo;
  public orderResult?: OrderResult;
  public subOrders?: BlockchainId[];
  public parentOrder?: BlockchainId;
  public consumer?: string;
  public origins?: Origins;
  public startDate?: number;
  public id: BlockchainId;

  constructor(orderId: BlockchainId) {
    this.id = orderId;
    if (!Order.contract) {
      Order.contract = BlockchainConnector.getInstance().getContract();
    }

    this.logger = rootLogger.child({ className: 'Order', orderId: this.id });
  }

  /**
   * Check if order exist
   */
  public isExist(): Promise<boolean> {
    return Order.contract.methods.isOrderValid(this.id).call();
  }

  /**
   * Check if order is in `processing` state
   */
  public isOrderProcessing(): Promise<boolean> {
    return Order.contract.methods.isOrderProcessing(this.id).call();
  }

  /**
   * Function for fetching avaliable for unlock order profit.
   */
  public async isOrderProfitAvailable(): Promise<TokenAmount> {
    const parsedResponse = await Order.contract.methods
      .isOrderProfitAvailable(this.id)
      .call()
      .then((response) => cleanWeb3Data(response) as { profit: TokenAmount });

    return parsedResponse.profit;
  }

  /**
   * Function for fetching order price
   */
  public calculateCurrentPrice(): Promise<TokenAmount> {
    return Order.contract.methods
      .calculateOrderCurrentPrice(this.id)
      .call()
      .then((price) => price.toString());
  }

  /**
   * Function for fetching order info from blockchain
   */
  @incrementMethodCall()
  public async getOrderInfo(): Promise<OrderInfo> {
    if (!(await this.checkIfOrderExistsWithInterval())) {
      throw Error(`Order ${this.id} does not exist`);
    }
    const orderInfo = (await Order.contract.methods.getOrder(this.id).call())['1'];
    const orderArgs = await Order.contract.methods.getOrderArgs(this.id).call();

    const a = cleanWeb3Data(orderInfo as any) as OrderInfoRaw;
    const finalOrderInfo: OrderInfo = orderInfoFromRaw(a, cleanWeb3Data(orderArgs) as OrderArgs);

    return (this.orderInfo = finalOrderInfo);
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
    const consumer = (await Order.contract.methods.getOrder(this.id).call())['0'];
    this.consumer = consumer;

    return this.consumer!;
  }

  /**
   * Function for fetching order result from blockchain
   */
  @incrementMethodCall()
  public async getOrderResult(): Promise<OrderResult> {
    const orderResults = (await Order.contract.methods.getOrder(this.id).call())['2'];

    return (this.orderResult = cleanWeb3Data(orderResults) as OrderResult);
  }

  /**
   * Function for fetching sub orders from blockchain
   */
  @incrementMethodCall()
  public async getSubOrders(): Promise<BlockchainId[]> {
    this.subOrders = await Order.contract.methods
      .getOrderSubOrders(this.id)
      .call()
      .then((ids) => ids.map((id) => id.toString()));

    return this.subOrders;
  }

  /**
   * Function for fetching parent order from blockchain
   */
  @incrementMethodCall()
  public async getParentOrder(): Promise<BlockchainId> {
    this.parentOrder = await Order.contract.methods
      .getOrderParentOrder(this.id)
      .call()
      .then((id) => id.toString());

    return this.parentOrder;
  }

  /**
   * Function for fetching order options deposit spent from blockchain
   */
  @incrementMethodCall()
  public getOptionsDepositSpent(): Promise<TokenAmount> {
    return Order.contract.methods
      .getOptionsDepositSpent(this.id)
      .call()
      .then((price) => price.toString());
  }

  /**
   * Function for fetching order deposit spent from blockchain
   */
  @incrementMethodCall()
  public async getSelectedUsage(): Promise<OrderUsage> {
    const coresDenominator = await TeeOffers.getDenominator();

    const selectedUsageSlotInfo = await Order.contract.methods
      .getOrderSelectedUsageSlotInfo(this.id)
      .call()
      .then((slotInfo) => cleanWeb3Data(slotInfo) as SlotInfo);

    const selectedUsageSlotUsage = await Order.contract.methods
      .getOrderSelectedUsageSlotUsage(this.id)
      .call()
      .then((slotUsage) => cleanWeb3Data(slotUsage) as SlotUsage);

    this.selectedUsage = await Order.contract.methods
      .getOrderSelectedUsage(this.id)
      .call()
      .then((selectedUsage) =>
        convertOrderUsage(
          cleanWeb3Data(selectedUsage) as OrderUsageRaw,
          unpackSlotInfo(selectedUsageSlotInfo, coresDenominator),
          formatUsage(selectedUsageSlotUsage),
        ),
      );

    this.selectedUsage.optionsCount = this.selectedUsage.optionsCount.map((item) => Number(item));
    this.selectedUsage.optionUsage = this.selectedUsage.optionUsage.map((usage) =>
      formatUsage(usage),
    );

    return this.selectedUsage;
  }

  /**
   * Function for fetching hold deposits sum of the order and its suborders
   */
  @incrementMethodCall()
  public calculateTotalOrderDeposit(): Promise<TokenAmount> {
    return Order.contract.methods
      .calculateTotalOrderDeposit(this.id)
      .call()
      .then((price) => price.toString());
  }

  /**
   * Function for fetching reserve for output order
   */
  @incrementMethodCall()
  public calculateOrderOutputReserve(): Promise<TokenAmount> {
    return Order.contract.methods
      .calculateOrderOutputReserve(this.id)
      .call()
      .then((price) => price.toString());
  }

  /**
   * Function for fetching spent deposits sum of the order and its suborders
   */
  @incrementMethodCall()
  public calculateTotalDepositSpent(): Promise<TokenAmount> {
    return Order.contract.methods
      .calculateTotalDepositSpent(this.id)
      .call()
      .then((price) => price.toString());
  }

  /**
   * Function for fetching unspent deposits sum of the order and its suborders
   */
  @incrementMethodCall()
  public calculateTotalDepositUnspent(): Promise<TokenAmount> {
    return Order.contract.methods
      .calculateTotalDepositUnspent(this.id)
      .call()
      .then((price) => price.toString());
  }

  /**
   * Fetch new Origins (createdDate, createdBy, modifiedDate and modifiedBy)
   */
  @incrementMethodCall()
  public async getOrigins(): Promise<Origins> {
    const origins: Origins = await Order.contract.methods
      .getOrderOrigins(this.id)
      .call()
      .then((origins) => cleanWeb3Data(origins) as Origins);

    // Convert blockchain time seconds to js time milliseconds
    origins.createdDate = Number(origins.createdDate) * 1000;
    origins.modifiedDate = Number(origins.modifiedDate) * 1000;

    return (this.origins = origins);
  }

  /**
   * Function for fetching parent order from blockchain
   */
  @incrementMethodCall()
  public getAwaitingPayment(): Promise<boolean> {
    return Order.contract.methods.getAwaitingPayment(this.id).call();
  }

  /**
   * Function for fetching deposit of order from blockchain
   */
  @incrementMethodCall()
  public getDeposit(): Promise<TokenAmount> {
    return Order.contract.methods
      .getOrderDeposit(this.id)
      .call()
      .then((price) => price.toString());
  }

  /**
   * Function for fetching start of processing date
   */
  @incrementMethodCall()
  public async getStartDate(): Promise<number> {
    return Number(await Order.contract.methods.getStartDate(this.id).call());
  }

  /**
   * Function for fetching start of processing date
   */
  @incrementMethodCall()
  public async calculateOrderTime(): Promise<number> {
    return Number(await Order.contract.methods.calculateOrderTime(this.id).call());
  }

  /**
   * Function for fetching parent order from blockchain
   */
  @incrementMethodCall()
  public async setAwaitingPayment(
    value: boolean,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      Order.contract.methods.setAwaitingPayment(this.id, value),
      transactionOptions,
    );
  }

  /**
   * Sets options deposit spent
   */
  @incrementMethodCall()
  public async setOptionsDepositSpent(
    value: TokenAmount,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      Order.contract.methods.setOptionsDepositSpent(this.id, value),
      transactionOptions,
    );
  }

  /**
   * Function for updating status of contract
   */
  @incrementMethodCall()
  public async updateStatus(
    status: OrderStatus,
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    if (status === OrderStatus.Processing) {
      await TxManager.execute(Order.contract.methods.processOrder(this.id), transactionOptions);
    }

    if (this.orderInfo) this.orderInfo.status = status;
  }

  /**
   * Function for updating status of contract
   */
  @incrementMethodCall()
  public async cancelOrder(transactionOptions?: TransactionOptions): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(Order.contract.methods.cancelOrder(this.id), transactionOptions);
  }

  /**
   * Starts suspended order
   */
  @incrementMethodCall()
  public async start(transactionOptions?: TransactionOptions): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(Order.contract.methods.startOrder(this.id), transactionOptions);
  }

  /**
   * Updates order result
   */
  @incrementMethodCall()
  public async updateOrderResult(
    encryptedResult = '',
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      Order.contract.methods.updateOrderResult(this.id, encryptedResult),
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
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      Order.contract.methods.completeOrder(this.id, status, encryptedResult),
      transactionOptions,
    );
  }

  /**
   * Unlocks profit
   */
  @incrementMethodCall()
  public async unlockProfit(transactionOptions?: TransactionOptions): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(Order.contract.methods.unlockProfit(this.id), transactionOptions);
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
    slots: OrderSlots,
    blockParentOrder: boolean,
    deposit?: TokenAmount,
    transactionOptions?: TransactionOptions,
    checkTxBeforeSend = false,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);
    deposit = deposit ?? '0';
    const args = subOrderInfo.args;
    const preparedInfo: OrderInfoRaw = orderInfoToRaw(subOrderInfo);
    const params: SubOrderParams = {
      blockParentOrder,
      deposit,
    };

    if (checkTxBeforeSend) {
      await TxManager.dryRun(
        Order.contract.methods.createSubOrder(this.id, preparedInfo, slots, args, params),
        transactionOptions,
      );
    }

    await TxManager.execute(
      Order.contract.methods.createSubOrder(this.id, preparedInfo, slots, args, params),
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
    subOrdersSlots: OrderSlots[],
    transactionOptions: TransactionOptions,
  ): Promise<string[]> {
    checkIfActionAccountInitialized(transactionOptions);
    if (subOrdersInfo.length !== subOrdersSlots.length) {
      throw Error(
        'SDK: Invalid arguments, subOrdersSlots should be the same size as subOrdersInfo.',
      );
    }

    const promises: Promise<TransactionReceipt>[] = [];
    for (let orderInfoIndex = 0; orderInfoIndex < subOrdersInfo.length; orderInfoIndex++) {
      const { blocking, deposit, ...orderInfo } = subOrdersInfo[orderInfoIndex];
      const args = orderInfo.args;
      const preparedInfo = orderInfoToRaw(orderInfo);
      const params: SubOrderParams = {
        blockParentOrder: blocking,
        deposit,
      };

      const transactionCall = Order.contract.methods.createSubOrder(
        this.id,
        preparedInfo,
        subOrdersSlots[orderInfoIndex],
        args,
        params,
      );

      promises.push(TxManager.execute(transactionCall, transactionOptions));
    }

    return (await Promise.all(promises)).map((tx) => tx.transactionHash as string);
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
    const subscription = contractWss.events.OrderStatusUpdated();
    subscription.on('data', (event: EventLog): void => {
      if (event.returnValues.orderId != this.id) {
        return;
      }
      const newStatus = <OrderStatus>event.returnValues.status?.toString();
      if (this.orderInfo) this.orderInfo.status = newStatus;
      callback(newStatus);
    });
    subscription.on('error', (error: Error) => {
      logger.warn(error);
    });

    return () => subscription.unsubscribe();
  }
}

export type onOrderStatusUpdatedCallback = (status: OrderStatus) => void;

export default Order;
