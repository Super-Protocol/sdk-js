import TCB from "../models/TCB";
import { checkIfActionAccountInitialized, getTimestamp } from "../utils";
import { ONE_DAY } from "../constants";
import { CheckingTcbData, EpochInfo } from "../types/Consensus";
import { TransactionOptions } from "../types/Web3";
import Superpro from "./Superpro";
import BlockchainConnector from "../connectors/BlockchainConnector";
import TxManager from "../utils/TxManager";

class Consensus {
    public static get address(): string {
        return Superpro.address;
    }

    private static async initializeTcbAndAssignBlocks(
        teeOfferId: string,
        initializeTcbForce: boolean,
        transactionOptions?: TransactionOptions,
    ): Promise<TCB> {
        let tcbId = await this.getInitializedTcbId(teeOfferId);
        let tcb = new TCB(tcbId);

        const timeInitialized: number = +(await tcb.get()).timeInitialized;
        const isFirstOffersTcb = timeInitialized == 0;
        const isCreatedMoreThenOneDayAgo = timeInitialized + ONE_DAY < +(await getTimestamp());

        if (isFirstOffersTcb || isCreatedMoreThenOneDayAgo || initializeTcbForce) {
            await this.initializeTcb(teeOfferId, transactionOptions);
            tcbId = await this.getInitializedTcbId(teeOfferId);
            tcb = new TCB(tcbId);
            await tcb.assignLastBlocksToCheck(transactionOptions);
            await tcb.assignSuspiciousBlocksToCheck(transactionOptions);
        }

        return tcb;
    }

    public static async initializeTcb(teeOfferId: string, transactionOptions?: TransactionOptions): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract();
        checkIfActionAccountInitialized();

        await TxManager.execute(contract.methods.initializeTcb, [teeOfferId], transactionOptions);
    }

    /**
     * Function initialize TCB and returns list of anothers' TCB for their checking
     * @param teeOfferId - id of TEE offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     * @returns tcbId and lists of anothers' TCB for their checking
     */
    public static async getListsForVerification(
        teeOfferId: string,
        initializeTcbForce = false,
        transactionOptions?: TransactionOptions,
    ): Promise<{
        tcbId: string;
        tcbsForVerification: CheckingTcbData[];
    }> {
        checkIfActionAccountInitialized();

        const tcb = await this.initializeTcbAndAssignBlocks(teeOfferId, initializeTcbForce, transactionOptions);
        const { blocksIds } = await tcb.getCheckingBlocksMarks();
        const tcbsForVerification: CheckingTcbData[] = [];

        for (let blockIndex = 0; blockIndex < blocksIds.length; blockIndex++) {
            const tcb = new TCB(blocksIds[blockIndex]);
            const tcbInfo = await tcb.get();
            tcbsForVerification.push({
                deviceId: tcbInfo.publicData.deviceID,
                properties: tcbInfo.publicData.properties,
                benchmark: tcbInfo.publicData.benchmark,
                quote: tcbInfo.quote,
                marks: tcbInfo.utilData.checkingBlockMarks,
                checkingBlocks: tcbInfo.utilData.checkingBlocks,
            });
        }

        return {
            tcbId: tcb.tcbId,
            tcbsForVerification,
        };
    }

    /**
     * Function return last inited TCB of TEE offer
     * @param teeOfferId - id of TEE offer
     * */
    public static async getInitializedTcbId(teeOfferId: string): Promise<string> {
        const contract = BlockchainConnector.getInstance().getContract();

        return contract.methods.getInitializedTcbId(teeOfferId).call();
    }

    public static async getEpochTime(
        time: number,
    ): Promise<{ epochStart: number; epochEnd: number; epochIndex: number }> {
        const contract = BlockchainConnector.getInstance().getContract();
        const result = await contract.methods.getEpochTime(time).call();

        return {
            epochStart: result[0],
            epochEnd: result[1],
            epochIndex: result[2],
        };
    }

    public static async getEpoch(epochIndex: number): Promise<EpochInfo> {
        const contract = BlockchainConnector.getInstance().getContract();

        return await contract.methods.getEpoch(epochIndex).call();
    }

    public static async getActualTcbId(teeOfferId: string): Promise<string> {
        const contract = BlockchainConnector.getInstance().getContract();

        return contract.methods.getActualTcbId(teeOfferId).call();
    }

    public static async getSuspiciousBlockTable(): Promise<string[]> {
        const contract = BlockchainConnector.getInstance().getContract();

        return contract.methods.getSuspiciousBlockTable().call();
    }

    public static async getSuspiciousBlockTableSize(): Promise<string[]> {
        const contract = BlockchainConnector.getInstance().getContract();

        return contract.methods.getSuspiciousBlockTableSize().call();
    }

    public static async getLastBlockTable(): Promise<string[]> {
        const contract = BlockchainConnector.getInstance().getContract();

        return contract.methods.getLastBlockTable().call();
    }

    public static async getLastBlockTableSize(): Promise<string[]> {
        const contract = BlockchainConnector.getInstance().getContract();

        return contract.methods.getLastBlockTableSize().call();
    }

    // TODO: get locked rewards info
    // TODO: claim avaliable rewards
}

export default Consensus;
