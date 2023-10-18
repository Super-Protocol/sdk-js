import { Contract } from 'web3';
import { abi } from '../contracts/abi';
import Superpro from '../staticModels/Superpro';
import TxManager from '../utils/TxManager';
import { BlockchainConnector } from '../connectors';
import { TcbData, TcbPublicData, TcbVerifiedStatus, TransactionOptions } from '../types';
import { checkIfActionAccountInitialized, packDevicId, unpackDeviceId } from '../utils/helper';

class TCB {
    public tcbId: bigint;
    private static contract: Contract<typeof abi>;

    constructor(tcbId: bigint) {
        this.tcbId = tcbId;
        if (!TCB.contract) {
            TCB.contract = BlockchainConnector.getInstance().getContract();
        }
    }

    private async applyTcbMarks(
        marks: TcbVerifiedStatus[],
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        await TxManager.execute(
            TCB.contract.methods.applyTcbMarks(marks, this.tcbId),
            transactionOptions,
        );
    }

    private async setTcbData(
        pb: TcbPublicData,
        quote: string,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        checkIfActionAccountInitialized(transactionOptions);

        const fromattedDeviceId = packDevicId(pb.deviceID);
        await TxManager.execute(
            TCB.contract.methods.setTcbData(
                this.tcbId,
                pb.benchmark,
                pb.properties,
                fromattedDeviceId,
                quote,
            ),
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
        pb: TcbPublicData,
        quote: string,
        marks: TcbVerifiedStatus[],
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        checkIfActionAccountInitialized(transactionOptions);

        await this.setTcbData(pb, quote, transactionOptions);
        await this.applyTcbMarks(marks, transactionOptions);
        await TxManager.execute(
            TCB.contract.methods.addTcbToSupply(this.tcbId),
            transactionOptions,
        );
    }

    /**
     * Assign TCB from SuspiciousBlocks table to check
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async assignSuspiciousBlocksToCheck(
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        await TxManager.execute(
            TCB.contract.methods.assignSuspiciousBlocksToCheck(this.tcbId),
            transactionOptions,
        );
    }

    /**
     * Assign TCB from LastBlocks table to check
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async assignLastBlocksToCheck(transactionOptions?: TransactionOptions): Promise<void> {
        await TxManager.execute(
            TCB.contract.methods.assignLastBlocksToCheck(this.tcbId),
            transactionOptions,
        );
    }

    /**
     * Function stake and lock TCB's reward
     * @param tcbId - TEE Offer's completed and valid TCB contract
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async claimRewards(transactionOptions?: TransactionOptions): Promise<void> {
        checkIfActionAccountInitialized();

        await TxManager.execute(TCB.contract.methods.claimRewards(this.tcbId), transactionOptions);
    }

    /**
     * Function unlock previously locked TCB rewards (by claimRewards)
     * @param tcbId - TCB contract address
     * @param unlockAmount - amount of tokens to unlock, max available amount = TeeOffer.getLockInfo(tcbAddress)
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async unlockRewards(transactionOptions?: TransactionOptions): Promise<void> {
        checkIfActionAccountInitialized();

        await TxManager.execute(
            TCB.contract.methods.unlockTcbReward(this.tcbId),
            transactionOptions,
        );
    }

    /**
     * Function for fetching all TCB data
     */
    public async get(): Promise<TcbData> {
        const tcb: TcbData = await TCB.contract.methods.getTcbById(this.tcbId).call();
        tcb.publicData.deviceID = unpackDeviceId(tcb.publicData.deviceID);

        return tcb;
    }

    /**
     * Function for fetching the given marks for recruited TCBs from the Tables of Consensus
     */
    public async getCheckingBlocksMarks(): Promise<{
        blocksIds: bigint[];
        marks: TcbVerifiedStatus[];
    }> {
        const tcb: TcbData = await TCB.contract.methods.getTcbById(this.tcbId).call();

        return {
            blocksIds: tcb.utilData.checkingBlocks,
            marks: tcb.utilData.checkingBlockMarks,
        };
    }

    /**
     * Function for fetching TCB avaliable reward
     */
    public getRewardAmount(): Promise<bigint> {
        return TCB.contract.methods.getTcbReward(this.tcbId).call();
    }
}

export default TCB;
