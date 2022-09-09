import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import appJSON from "../contracts/app.json";
import { checkIfActionAccountInitialized, checkIfInitialized, tupleToObject } from "../utils";
import { TransactionOptions } from "../types/Web3";
import { formatBytes32String, parseBytes32String } from "ethers/lib/utils";
import Superpro from "../staticModels/Superpro";
import TxManager from "../utils/TxManager";
import BlockchainConnector from "../BlockchainConnector";
import {
    TcbStatus,
    PublicData,
    TcbEpochInfo,
    PublicDataStructure,
    TcbEpochInfoStructure,
    TcbVerifiedStatus,
} from "../types/Consensus";

class TCB {
    public tcbId: string;
    private contract: Contract;
    private logger: typeof rootLogger;

    constructor(tcbId: string) {
        checkIfInitialized();

        this.logger = rootLogger.child({
            className: "TCB",
            tcbId,
        });

        this.tcbId = tcbId;
        this.contract = BlockchainConnector.getContractInstance();
    }

    private checkInitTcb(transactionOptions?: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();

            return new transactionOptions.web3.eth.Contract(<AbiItem[]>appJSON.abi, Superpro.address);
        }

        return this.contract;
    }

    private async applyTcbMarks(marks: TcbVerifiedStatus[], transactionOptions?: TransactionOptions): Promise<void> {
        await TxManager.execute(this.contract.methods.applyTcbMarks, [marks, this.tcbId], transactionOptions);
    }

    private async setTcbData(pb: PublicData, quote: string, transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized(transactionOptions);

        const fromattedDeviceId = formatBytes32String(Buffer.from(pb.deviceID).toString("base64"));

        await TxManager.execute(
            this.contract.methods.setTcbData,
            [this.tcbId, pb.benchmark, pb.properties, fromattedDeviceId, quote],
            transactionOptions,
        );
    }

    /**
     * Add data to TeeConfirmationBlock and push it to Consensus
     * @param pb - struct of 'processed' data
     * @param quote - data generated from Enclave
     * @param marks - list of marks
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async addToSupply(
        pb: PublicData,
        quote: string,
        marks: TcbVerifiedStatus[],
        transactionOptions?: TransactionOptions,
    ) {
        checkIfActionAccountInitialized(transactionOptions);

        await this.setTcbData(pb, quote, transactionOptions);
        await this.applyTcbMarks(marks, transactionOptions);
        await TxManager.execute(this.contract.methods.addTcbToSupply, [this.tcbId], transactionOptions);
    }

    /**
     * Assign TCB from SuspiciousBlocks table to check
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async assignSuspiciousBlocksToCheck(transactionOptions?: TransactionOptions) {
        await TxManager.execute(this.contract.methods.assignSuspiciousBlocksToCheck, [this.tcbId], transactionOptions);
    }

    /**
     * Assign TCB from LastBlocks table to check
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async assignLastBlocksToCheck(transactionOptions?: TransactionOptions) {
        await TxManager.execute(this.contract.methods.assignLastBlocksToCheck, [this.tcbId], transactionOptions);
    }

    /**
     * Function stake and lock TCB's reward
     * @param tcbId - TEE Offer's completed and valid TCB contract
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async claimRewards(tcbId: string, transactionOptions?: TransactionOptions): Promise<void> {
        const contract = this.checkInitTcb(transactionOptions);
        checkIfActionAccountInitialized();

        await TxManager.execute(contract.methods.claimRewards, [tcbId], transactionOptions);
    }

    /**
     * Function unlock previously locked TCB rewards (by claimRewards)
     * @param tcbId - TCB contract address
     * @param unlockAmount - amount of tokens to unlock, max available amount = TeeOffer.getLockInfo(tcbAddress)
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async unlockRewards(
        tcbId: string,
        unlockAmount: number,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = this.checkInitTcb(transactionOptions);
        checkIfActionAccountInitialized();

        await TxManager.execute(contract.methods.unlockRewards, [tcbId, unlockAmount], transactionOptions);
    }

    /**
     * Function for fetching all TCB data
     */
    public async get(): Promise<any> {
        return this.contract.methods.getTcbById(this.tcbId).call();
    }

    /**
     * Function for fetching the given marks for recruited TCBs from the Tables of Consensus
     */
    public async getCheckingBlocksMarks(): Promise<{ blocksIds: string[]; marks: TcbVerifiedStatus[] }> {
        const tcb = await this.contract.methods.getTcbById(this.tcbId).call();

        return {
            blocksIds: tcb.utilData.checkingBlocks,
            marks: tcb.utilData.checkingBlockMarks,
        };
    }

    /**
     * Function for fetching used TCB data
     */
    public async getPublicData(): Promise<PublicData> {
        const publicDataParams = await this.contract.methods.getPublicData().call();

        const publicData: PublicData = tupleToObject(publicDataParams, PublicDataStructure);
        publicData.deviceID = Buffer.from(parseBytes32String(publicData.deviceID), "base64").toString("hex");

        return publicData;
    }

    /**
     * Function for fetching TCB status
     */
    public async getStatus(): Promise<TcbStatus> {
        return this.contract.methods.getTcbStatus().call();
    }

    /**
     * Function for fetching TCB status
     */
    public async getEpochInfo(): Promise<TcbEpochInfo> {
        const epoch = await this.contract.methods.getEpochInfo().call();

        return tupleToObject(epoch, TcbEpochInfoStructure);
    }
}

export default TCB;
