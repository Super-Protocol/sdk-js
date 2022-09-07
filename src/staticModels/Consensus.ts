import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import appJSON from "../contracts/app.json";
import TCB from "../models/TCB";
import { checkIfActionAccountInitialized, checkIfInitialized, getTimestamp } from "../utils";
import { ONE_DAY } from "../constants";
import { CheckingTcbData, TcbEpochInfo, EpochInfo } from "../types/Consensus";
import { TransactionOptions } from "../types/Web3";
import Superpro from "./Superpro";
import TxManager from "../utils/TxManager";

class Consensus {
    public static address: string;
    private static contract: Contract;
    private static logger: typeof rootLogger;

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit(transactionOptions?: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();

            return new transactionOptions.web3.eth.Contract(<AbiItem[]>appJSON.abi, this.address);
        }

        if (this.contract) return this.contract;
        checkIfInitialized();

        this.logger = rootLogger.child({ className: "Consensus" });

        return (this.contract = new store.web3!.eth.Contract(<AbiItem[]>appJSON.abi, Superpro.address));
    }

    private static async initializeTcbAndAssignBlocks(
        teeOfferId: string,
        transactionOptions?: TransactionOptions,
    ): Promise<TCB> {
        let tcbId = await this.getInitializedTcbId(teeOfferId);
        let tcb = new TCB(tcbId);

        const timeInitialized: number = +(await tcb.get()).timeInitialized;
        const isFirstOffersTcb = timeInitialized == 0;
        const isCreatedMoreThenOneDayAgo = timeInitialized + ONE_DAY < +(await getTimestamp());

        if (isFirstOffersTcb || isCreatedMoreThenOneDayAgo) {
            await this.initializeTcb(teeOfferId, transactionOptions);
            tcbId = await this.getInitializedTcbId(teeOfferId);
            tcb = new TCB(tcbId);
            await tcb.assignLastBlocksToCheck(transactionOptions);
            await tcb.assignSuspiciousBlocksToCheck(transactionOptions);
        }

        return tcb;
    }

    public static async initializeTcb(teeOfferId: string, transactionOptions?: TransactionOptions): Promise<void> {
        this.checkInit();
        checkIfActionAccountInitialized();

        await TxManager.execute(this.contract.methods.initializeTcb, [teeOfferId], transactionOptions);
    }

    /**
     * Function initialize TCB and returns list of anothers' TCB for their checking
     * @param teeOfferId - id of TEE offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     * @returns tcbId and lists of anothers' TCB for their checking
     */
    public static async getListsForVerification(
        teeOfferId: string,
        transactionOptions?: TransactionOptions,
    ): Promise<{
        tcbId: string;
        checkingTcbData: CheckingTcbData[];
    }> {
        this.checkInit();
        checkIfActionAccountInitialized();

        const tcb = await this.initializeTcbAndAssignBlocks(teeOfferId, transactionOptions);
        const { blocksIds } = await tcb.getCheckingBlocksMarks();
        const checkingTcbData = [];

        for (let blockIndex = 0; blockIndex < blocksIds.length; blockIndex++) {
            const tcb = new TCB(blocksIds[blockIndex]);
            const tcbInfo = await tcb.get();
            checkingTcbData.push({
                deviceID: tcbInfo.publicData.deviceID,
                properties: tcbInfo.publicData.properties,
                benchmark: tcbInfo.publicData.benchmark,
                tcbQuote: tcbInfo.quote,
                tcbMarks: tcbInfo.utilData.checkingBlockMarks,
            });
        }

        return {
            tcbId: tcb.tcbId,
            checkingTcbData,
        };
    }

    /**
     * Function return last inited TCB of TEE offer
     * @param teeOfferId - id of TEE offer
     * */
    public static async getInitializedTcbId(teeOfferId: string): Promise<string> {
        this.checkInit();

        return this.contract.methods.getInitializedTcbId(teeOfferId).call();
    }

    public static async getEpochIndex(): Promise<number> {
        this.checkInit();

        return +(await this.contract.methods.getEpochIndex().call());
    }

    public static async getEpoch(epochIndex: number): Promise<EpochInfo> {
        this.checkInit();

        return await this.contract.methods.getEpoch(epochIndex).call();
    }

    public static async getActualTcbId(teeOfferId: string): Promise<string> {
        this.checkInit();

        return this.contract.methods.getActualTcbId(teeOfferId).call();
    }

    public static async getSuspiciousBlockTable(): Promise<string[]> {
        this.checkInit();

        return this.contract.methods.getSuspiciousBlockTable().call();
    }

    public static async getSuspiciousBlockTableSize(): Promise<string[]> {
        this.checkInit();

        return this.contract.methods.getSuspiciousBlockTableSize().call();
    }

    public static async getLastBlockTable(): Promise<string[]> {
        this.checkInit();

        return this.contract.methods.getLastBlockTable().call();
    }

    public static async getLastBlockTableSize(): Promise<string[]> {
        this.checkInit();

        return this.contract.methods.getLastBlockTableSize().call();
    }

    // TODO: get locked rewards info
    // TODO: claim avaliable rewards
}

export default Consensus;
