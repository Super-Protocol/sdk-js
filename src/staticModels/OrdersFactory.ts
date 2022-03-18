import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import OrdersFactoryJSON from "../contracts/OrdersFactory.json";
import {
    checkIfActionAccountInitialized,
    checkIfInitialized,
    createTransactionOptions,
    objectToTuple
} from "../utils";
import { OrderInfo, OrderInfoStructure } from "../types/Order";
import { formatBytes32String } from 'ethers/lib/utils';
import { ContractEvent, TransactionOptions } from "../types/Web3";

class OrdersFactory {
    public static address: string;
    private static contract: Contract;
    private static logger: typeof rootLogger;

    public static orders?: string[];

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit(transactionOptions?: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();
            return new transactionOptions.web3.eth.Contract(<AbiItem[]>OrdersFactoryJSON.abi, this.address);
        }

        if (this.contract) return this.contract;
        checkIfInitialized();

        this.logger = rootLogger.child({ className: "OrdersFactory", address: this.address });
        return this.contract = new store.web3!.eth.Contract(<AbiItem[]>OrdersFactoryJSON.abi, this.address);
    }

    /**
     * Function for fetching list of all orders addresses
     */
    public static async getAllOrders(): Promise<string[]> {
        this.checkInit();
        this.orders = await this.contract.methods.listAll().call();
        return this.orders!;
    }

    /**
     * Function for fetching order hold deposit for specific order
     * @param orderAddress - address of order for fetching hold deposit
     */
    public static async getOrderHoldDeposit(orderAddress: string): Promise<number> {
        this.checkInit();
        return await this.contract.methods.getOrderHoldDeposit(orderAddress).call();
    }

    /**
     * Function for adding event listeners on order created event in orders factory contract
     * @param callback - function for processing created order
     * @return unsubscribe - unsubscribe function from event
     */
    public static onOrderCreated(callback: onOrderCreatedCallback): () => void {
        this.checkInit();
        const logger = this.logger.child({ method: "onOrderCreated" });

        let subscription = this.contract.events
            .OrderCreated()
            .on("data", async (event: ContractEvent) => {
                callback(<string>event.returnValues.newOrderAddress);
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    /**
     * Function for creating orders
     * @param orderInfo - order info for new order
     * @param suspended - is orders suspended
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     * @returns Promise<void> - Does not return address of created contract!
     */
    public static async createOrder(
        orderInfo: OrderInfo,
        holdDeposit = 0,
        suspended = false,
        externalId = formatBytes32String('default'),
        transactionOptions?: TransactionOptions
    ) {
        const contract = this.checkInit(transactionOptions);
        checkIfActionAccountInitialized();


        const orderInfoArguments = objectToTuple(orderInfo, OrderInfoStructure);
        await contract.methods
            .create(orderInfoArguments, holdDeposit, suspended, externalId)
            .send(await createTransactionOptions(transactionOptions));
    }

    /**
     * Function for refilling order deposit
     * @param orderAddress - address of order
     * @param amount - amount of tokens to refilling
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async refillOrderDeposit(
        orderAddress: string,
        amount: number,
        transactionOptions?: TransactionOptions
    ) {
        const contract = this.checkInit(transactionOptions);
        checkIfActionAccountInitialized();

        await contract.methods
            .refillOrder(orderAddress, amount)
            .send(await createTransactionOptions(transactionOptions));
    }
}

export type onOrderCreatedCallback = (address: string) => void;

export default OrdersFactory;
