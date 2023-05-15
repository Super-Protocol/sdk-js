import rootLogger from "../logger";
import TCB from "../models/TCB";
import { checkIfActionAccountInitialized, tupleToObject } from "../utils";
import { EpochInfo } from "../types/Consensus";
import { TeeConfirmationBlock, GetTcbRequest } from "@super-protocol/dto-js";
import { TransactionOptions, ContractEvent, BlockInfo } from "../types/Web3";
import Superpro from "./Superpro";
import BlockchainConnector from "../connectors/BlockchainConnector";
import BlockchainEventsListener from "../connectors/BlockchainEventsListener";
import TxManager from "../utils/TxManager";
import { ConsensusConstants, ConsensusConstantsStructure } from "../types/Consensus";

class Consensus {
    private static readonly logger = rootLogger.child({ className: "Consensus" });

    public static get address(): string {
        return Superpro.address;
    }

    private static async initializeTcbAndAssignBlocks(
        teeOfferId: string,
        transactionOptions?: TransactionOptions,
    ): Promise<TCB> {
        await this.initializeTcb(teeOfferId, transactionOptions);
        const tcbId = await this.getInitializedTcbId(teeOfferId);
        const tcb = new TCB(tcbId);

        await tcb.assignLastBlocksToCheck(transactionOptions);
        await tcb.assignSuspiciousBlocksToCheck(transactionOptions);

        return tcb;
    }

    public static async initializeTcb(teeOfferId: string, transactionOptions?: TransactionOptions): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract();
        checkIfActionAccountInitialized();

        await TxManager.execute(contract.methods.initializeTcb, [teeOfferId], transactionOptions);
    }

    public static async isTcbCreationAvailable(teeOfferId: string): Promise<boolean> {
        const contract = BlockchainConnector.getInstance().getContract();
        const [offerNotBlocked, newEpochStarted, halfEpochPassed, benchmarkVerified] = await contract.methods
            .isTcbCreationAvailable(teeOfferId)
            .call();

        return offerNotBlocked && newEpochStarted && halfEpochPassed && benchmarkVerified;
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
    ): Promise<GetTcbRequest> {
        checkIfActionAccountInitialized();

        const tcb = await this.initializeTcbAndAssignBlocks(teeOfferId, transactionOptions);
        const { blocksIds } = await tcb.getCheckingBlocksMarks();
        const tcbsForVerification: TeeConfirmationBlock[] = [];

        for (let blockIndex = 0; blockIndex < blocksIds.length; blockIndex++) {
            const tcb = new TCB(blocksIds[blockIndex]);
            const tcbInfo = await tcb.get();
            tcbsForVerification.push({
                tcbId: blocksIds[blockIndex].toString(),
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
        const [epochStart, epochEnd, epochIndex] = await contract.methods.getEpochTime(time).call();

        return {
            epochStart,
            epochEnd,
            epochIndex,
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

    public static async getConstants(): Promise<ConsensusConstants> {
        const contract = BlockchainConnector.getInstance().getContract();
        const response = await contract.methods.getConsensusConstants().call();

        return tupleToObject(response, ConsensusConstantsStructure);
    }

    public static onTcbBanned(callback: onTcbBannedCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onTcbBanned" });

        const subscription = contract.events
            .TcbBanned()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.tcbId,
                    <string>event.returnValues.provider,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    public static onTcbCompleted(callback: onTcbCompletedCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onTcbCompleted" });

        const subscription = contract.events
            .TcbCompleted()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.tcbId,
                    <string>event.returnValues.provider,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    public static onTcbInitialized(callback: onTcbInitializedCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onTcbInitialized" });

        const subscription = contract.events
            .TcbInitialized()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.tcbId,
                    <string>event.returnValues.provider,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    public static onTcbBenchmarkChanged(callback: onTcbBenchmarkChangedCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onTcbBenchmarkChanged" });

        const subscription = contract.events
            .TcbBenchmarkChanged()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.tcbId,
                    <string>event.returnValues.provider,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    public static onRewardsClaimed(callback: onRewardsClaimedCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onRewardsClaimed" });

        const subscription = contract.events
            .RewardsClaimed()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.tcbId,
                    <string>event.returnValues.amount,
                    <string>event.returnValues.claimer,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }

    public static onTeeOfferViolationRateChanged(callback: onTeeOfferViolationRateChangedCallback): () => void {
        const contract = BlockchainEventsListener.getInstance().getContract();
        const logger = this.logger.child({ method: "onTeeOfferViolationRateChanged" });

        const subscription = contract.events
            .TeeOfferViolationRateChanged()
            .on("data", async (event: ContractEvent) => {
                callback(
                    <string>event.returnValues.providerAuth,
                    <string>event.returnValues.teeOfferId,
                    <string>event.returnValues.violationRate,
                    <BlockInfo>{
                        index: <number>event.blockNumber,
                        hash: <string>event.blockHash,
                    },
                );
            })
            .on("error", (error: Error, receipt: string) => {
                if (receipt) return; // Used to avoid logging of transaction rejected
                logger.warn(error);
            });

        return () => subscription.unsubscribe();
    }
}

export type onTeeOfferViolationRateChangedCallback = (
    providerAuth: string,
    teeOfferId: string,
    violationRate: string,
    block?: BlockInfo,
) => void;
export type onRewardsClaimedCallback = (tcbId: string, amount: string, claimer: string, block?: BlockInfo) => void;
export type onTcbBenchmarkChangedCallback = (tcbId: string, provider: string, block?: BlockInfo) => void;
export type onTcbInitializedCallback = (tcbId: string, provider: string, block?: BlockInfo) => void;
export type onTcbCompletedCallback = (tcbId: string, provider: string, block?: BlockInfo) => void;
export type onTcbBannedCallback = (tcbId: string, provider: string, block?: BlockInfo) => void;
export default Consensus;
