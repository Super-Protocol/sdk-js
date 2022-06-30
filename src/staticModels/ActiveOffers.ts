import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import ActiveOffersJSON from "../contracts/ActiveOffersList.json";
import { checkIfInitialized } from "../utils";
import { BigNumber } from "ethers";
import { TransactionOptions } from "../types/Web3";
import Superpro from "./Superpro";
import TxManager from "../utils/TxManager";

class ActiveOffers {
    private static contract: Contract;
    private static logger: typeof rootLogger;

    public static offers?: string[];

    public static get address(): string {
        return Superpro.address;
    }

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit(transactionOptions?: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();

            return new transactionOptions.web3.eth.Contract(<AbiItem[]>ActiveOffersJSON.abi, Superpro.address);
        }

        if (this.contract) return this.contract;
        checkIfInitialized();

        this.logger = rootLogger.child({ className: "ActiveOffers" });

        return (this.contract = new store.web3!.eth.Contract(<AbiItem[]>ActiveOffersJSON.abi, Superpro.address));
    }

    public static async getListOfActiveOffersSize(): Promise<BigNumber> {
        this.checkInit();

        return await this.contract.methods.getListOfActiveOffersSize().call();
    }

    public static async getActiveOffersEventsQueueLength(): Promise<BigNumber> {
        this.checkInit();

        return this.contract.methods.getActiveOffersEventsQueueLength().call();
    }

    /**
     * Function returns ids of active offers (value and TEE)
     * Attention! Check active offers events queue length before calling this function, for actualy status it should be equal to 0.
     * @param begin The first element of range.
     * @param end One past the final element in the range.
     * @returns {Promise<string[]>}
     */
    public static async getListOfActiveOffersRange(
        begin?: BigNumber | number,
        end?: BigNumber | number,
    ): Promise<string[]> {
        this.checkInit();
        const logger = this.logger.child({ method: "getListOfActiveOffersRange" });

        begin = begin ?? 0;
        end = end ?? (await this.contract.methods.getListOfActiveOffersSize().call());

        return await this.contract.methods.getListOfActiveOffersRange(begin, end).call();
    }

    /**
     * Function updates information about the list of current offers
     * @param maxProcessedEvents - maximum number of events to process (affects gas cost of operation)
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async updateListOfActiveOffers(
        maxProcessedEvents: number,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        this.checkInit();

        await TxManager.execute(
            this.contract.methods.updateListOfActiveOffers,
            [maxProcessedEvents],
            transactionOptions,
        );
    }
}

export default ActiveOffers;