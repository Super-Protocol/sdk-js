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
  OrderInfoRaw,
  orderInfoToRaw,
} from '../types/index.js';
import { Contract, TransactionReceipt } from 'web3';
import { EventLog } from 'web3-eth-contract';
import rootLogger from '../logger.js';
import { abi } from '../contracts/abi.js';
import {
  checkIfActionAccountInitialized,
  cleanWeb3Data,
  convertOrderUsage,
  formatUsage,
  incrementMethodCall,
  unpackSlotInfo,
} from '../utils/helper.js';
import { BlockchainConnector, BlockchainEventsListener } from '../connectors/index.js';
import TeeOffers from '../staticModels/TeeOffers.js';
import TxManager from '../utils/TxManager.js';
import { tryWithInterval } from '../utils/helpers/index.js';
import { BLOCKCHAIN_CALL_RETRY_INTERVAL, BLOCKCHAIN_CALL_RETRY_ATTEMPTS } from '../constants.js';
import {
  WssSubscriptionOnDataFn,
  WssSubscriptionOnErrorFn,
} from '../connectors/BlockchainEventsListener.js';

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

  public isExist(): Promise<boolean> {
    return Order.contract.methods.isOrderValid(this.id).call();
  }

  public isOrderProcessing(): Promise<boolean> {
    return Order.contract.methods.isOrderProcessing(this.id).call();
  }

  public async isOrderProfitAvailable(): Promise<TokenAmount> {
    const parsedResponse = await Order.contract.methods
      .isOrderProfitAvailable(this.id)
      .call()
      .then((response) => cleanWeb3Data(response) as { profit: TokenAmount });

    return parsedResponse.profit;
  }

  public calculateCurrentPrice(): Promise<TokenAmount> {
    return Order.contract.methods
      .calculateOrderCurrentPrice(this.id)
      .call()
      .then((price) => price.toString());
  }

  @incrementMethodCall()
  public async getOrderInfo(): Promise<OrderInfo> {
    if (!(await this.checkIfOrderExistsWithInterval())) {
      throw Error(`Order ${this.id} does not exist`);
    }
    const orderInfoParams = await Order.contract.methods.getOrder(this.id).call();
    const orderArgs = await Order.contract.methods.getOrderArgs(this.id).call();
    const cleanedOrderInfo = cleanWeb3Data(orderInfoParams[1]);

    const finalOrderInfo: OrderInfo = orderInfoFromRaw(
      cleanedOrderInfo as OrderInfoRaw,
      cleanWeb3Data(orderArgs) as OrderArgs,
    );

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
    const consumer = await Order.contract.methods.getOrder(this.id).call();
    this.consumer = consumer[0];

    return this.consumer!;
  }

  @incrementMethodCall()
  public async getOrderResult(): Promise<OrderResult> {
    const orderResults = await Order.contract.methods.getOrder(this.id).call();

    return (this.orderResult = cleanWeb3Data(orderResults[2]) as OrderResult);
  }

  @incrementMethodCall()
  public async getSubOrders(): Promise<BlockchainId[]> {
    this.subOrders = await Order.contract.methods
      .getOrderSubOrders(this.id)
      .call()
      .then((ids) => ids.map((id) => id.toString()));

    return this.subOrders;
  }

  @incrementMethodCall()
  public async getParentOrder(): Promise<BlockchainId> {
    this.parentOrder = await Order.contract.methods
      .getOrderParentOrder(this.id)
      .call()
      .then((id) => id.toString());

    return this.parentOrder;
  }

  @incrementMethodCall()
  public getOptionsDepositSpent(): Promise<TokenAmount> {
    return Order.contract.methods
      .getOptionsDepositSpent(this.id)
      .call()
      .then((price) => price.toString());
  }

  @incrementMethodCall()
  public async getSelectedUsage(): Promise<OrderUsage> {
    const coresDenominator = await TeeOffers.getDenominator();

    const selectedUsageSlotInfo = await Order.contract.methods
      .getOrderSelectedUsageSlotInfo(this.id)
      .call()
      .then((slotInfo) => cleanWeb3Data(slotInfo) as unknown as SlotInfo);

    const selectedUsageSlotUsage = await Order.contract.methods
      .getOrderSelectedUsageSlotUsage(this.id)
      .call()
      .then((slotUsage) => cleanWeb3Data(slotUsage) as unknown as SlotUsage);

    this.selectedUsage = await Order.contract.methods
      .getOrderSelectedUsage(this.id)
      .call()
      .then((selectedUsage) =>
        convertOrderUsage(
          cleanWeb3Data(selectedUsage) as unknown as OrderUsageRaw,
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

  @incrementMethodCall()
  public getCertificate(): Promise<string> {
    return Order.contract.methods.getOrderCertificate(this.id).call();
  }

  @incrementMethodCall()
  public async setCertificate(
    certificate = '',
    transactionOptions?: TransactionOptions,
  ): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(
      Order.contract.methods.setOrderCertificate(this.id, certificate),
      transactionOptions,
    );
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

  @incrementMethodCall()
  public getAwaitingPayment(): Promise<boolean> {
    return Order.contract.methods.getAwaitingPayment(this.id).call();
  }

  @incrementMethodCall()
  public getDeposit(): Promise<TokenAmount> {
    return Order.contract.methods
      .getOrderDeposit(this.id)
      .call()
      .then((price) => price.toString());
  }

  @incrementMethodCall()
  public async getStartDate(): Promise<number> {
    return Number(await Order.contract.methods.getStartDate(this.id).call());
  }

  @incrementMethodCall()
  public async calculateOrderTime(): Promise<number> {
    return Number(await Order.contract.methods.calculateOrderTime(this.id).call());
  }

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

  @incrementMethodCall()
  public async cancelOrder(transactionOptions?: TransactionOptions): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(Order.contract.methods.cancelOrder(this.id), transactionOptions);
  }

  @incrementMethodCall()
  public async start(transactionOptions?: TransactionOptions): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(Order.contract.methods.startOrder(this.id), transactionOptions);
  }

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

  @incrementMethodCall()
  public async unlockProfit(transactionOptions?: TransactionOptions): Promise<void> {
    checkIfActionAccountInitialized(transactionOptions);

    await TxManager.execute(Order.contract.methods.unlockProfit(this.id), transactionOptions);
  }

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

  public onStatusUpdated(callback: onOrderStatusUpdatedCallback): () => void {
    const listener = BlockchainEventsListener.getInstance();
    const logger = this.logger.child({ method: 'onOrderStatusUpdated' });
    const onData: WssSubscriptionOnDataFn = (event: EventLog): void => {
      if (event.returnValues.orderId != this.id) {
        return;
      }
      const newStatus = <OrderStatus>event.returnValues.status?.toString();
      if (this.orderInfo) this.orderInfo.status = newStatus;
      callback(newStatus);
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
}

export type onOrderStatusUpdatedCallback = (status: OrderStatus) => void;

export default Order;
