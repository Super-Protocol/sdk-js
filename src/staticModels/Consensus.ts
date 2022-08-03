import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
// import ConsensusJSON from "../contracts/Consensus.json";
import OffersJSON from "../contracts/Offers.json";
import TCB from "../models/TCB";
import LastBlocks from "./LastBlocks";
import Suspicious from "./Suspicious";
import { checkIfActionAccountInitialized, checkIfInitialized, getTimestamp } from "../utils";
import { ONE_DAY } from "../constants";
import { PublicData, LType } from "../types/TcbData";
import { TransactionOptions } from "../types/Web3";
import Superpro from "./Superpro";
import TxManager from "../utils/TxManager";

class Consensus {
    public static address: string;
    private static contract: Contract;
    private static logger: typeof rootLogger;

    public static LEnough = async (tcb: TCB): Promise<boolean> => {
        return +(await tcb.needL1toCompleted()) === 0 && +(await tcb.needL2toCompleted()) === 0;
    };
    public static offers?: string[];

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit(transactionOptions?: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();
            // return new transactionOptions.web3.eth.Contract(<AbiItem[]>ConsensusJSON.abi, this.address);
            // TODO: stub
            return new transactionOptions.web3!.eth.Contract(<AbiItem[]>OffersJSON.abi, Superpro.address);
        }

        if (this.contract) return this.contract;
        checkIfInitialized();

        this.logger = rootLogger.child({ className: "Consensus" });
        // return this.contract = new store.web3!.eth.Contract(<AbiItem[]>ConsensusJSON.abi, this.address);
        // TODO: stub
        this.contract = new store.web3!.eth.Contract(<AbiItem[]>OffersJSON.abi, Superpro.address);

        return this.contract;
    }

    private static async initTcb(teeOfferId: string, transactionOptions?: TransactionOptions): Promise<TCB> {
        await TxManager.execute(this.contract.methods.initTcb, [teeOfferId], transactionOptions);

        const tcbId = await this.getInitedTcb(teeOfferId);
        return new TCB(tcbId);
    }

    private static async addToSupply(tcbId: string, transactionOptions?: TransactionOptions) {
        await TxManager.execute(this.contract.methods.addToSupply, [tcbId], transactionOptions);
    }

    private static async addMarks(
        L1Marks: number[],
        L2Marks: number[],
        tcb: TCB,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const logger = this.logger.child({ method: "addTcbMarks" });

        const needAddMarks = async (lType: LType): Promise<number> => {
            return lType == LType.L1
                ? (await tcb.getL1()).length - (await tcb.getL1Marks()).length
                : (await tcb.getL2()).length - (await tcb.getL2Marks()).length;
        };
        const addAdjustedMarks = async (diff: number, marks: number[], lType: LType) => {
            if (diff > marks.length) {
                logger.error("Invalid L marks count");
                return;
            }
            if (diff > 0) {
                const adjustedMarks = marks.slice(diff * -1);
                await tcb.addMarks(lType, adjustedMarks, transactionOptions);
            }
            // diff == 0, it's ok - do nothing
            // diff < 0, it can’t be, bcs this case verified in the blockchain
        };

        const l1MarksDiff = await needAddMarks(LType.L1);
        const l2MarksDiff = await needAddMarks(LType.L2);

        await addAdjustedMarks(l1MarksDiff, L1Marks, LType.L1);
        await addAdjustedMarks(l2MarksDiff, L2Marks, LType.L2);
    }

    /**
     * Function initialize TCB and returns two lists of anothers' TCB ids for their checking
     * @param teeOfferId
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     * @returns two lists of anothers' TCB ids for their checking
     */
    public static async getListsForVerification(
        teeOfferId: string,
        transactionOptions?: TransactionOptions,
    ): Promise<{ L1: string[]; L2: string[] }> {
        this.checkInit();
        checkIfActionAccountInitialized();

        const alreadyInited = await this.getInitedTcb(teeOfferId);
        const tcbTimeInited = await this.getTimeInited(teeOfferId);
        const timestamp = await getTimestamp();

        const tcb =
            tcbTimeInited !== 0 && tcbTimeInited + ONE_DAY > timestamp
                ? new TCB(alreadyInited)
                : await this.initTcb(teeOfferId, transactionOptions);

        if (!(await this.LEnough(tcb))) {
            // counted how many L2 are missing to complete TCB
            const numberOfMissingL2 = +(await tcb.needL2toCompleted());

            await LastBlocks.getRandomL1(tcb.id, transactionOptions);
            await Suspicious.getRandomL2(tcb.id, numberOfMissingL2, transactionOptions);
        }

        const L1 = await tcb.getL1();
        const L2 = await tcb.getL2();

        return {
            L1,
            L2,
        };
    }

    /**
     * Add data to TeeConfirmationBlock and push it to Consensus
     * @param teeOfferId - TCB's device offer, as key
     * @param L1Marks - marks of LastBlocks
     * @param L2Marks - marks of SuspiciousBlocks
     * @param tcbData - TEE generated
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async addTCB(
        teeOfferId: string,
        L1Marks: number[],
        L2Marks: number[],
        tcbData: { publicData: PublicData; quote: string },
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        this.checkInit();
        checkIfActionAccountInitialized();
        const logger = this.logger.child({ method: "addTCB" });

        const tcb = new TCB(await this.getInitedTcb(teeOfferId));
        if (!(await this.LEnough(tcb))) logger.error("L is not enough to complite TCB");

        // Can be upgraded to completion of TCB
        await tcb.addData(tcbData.publicData, tcbData.quote, transactionOptions);

        await this.addMarks(L1Marks, L2Marks, tcb, transactionOptions);

        await this.addToSupply(tcb.id, transactionOptions);
    }

    /**
     * Function stake and lock TCB's reward
     * @param tcbId - TEE Offer's completed and valid TCB contract
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async claimRewards(tcbId: string, transactionOptions?: TransactionOptions): Promise<void> {
        const contract = this.checkInit(transactionOptions);
        checkIfActionAccountInitialized();

        await TxManager.execute(contract.methods.claimRewards, [tcbId], transactionOptions);
    }

    /**
     * Function unlock previously locked TCB rewards (by claimRewards)
     * @param tcbId - TCB id
     * @param unlockAmount - amount of tokens to unlock, max available amount = TeeOffer.getLockInfo(tcbId)
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async unlockRewards(
        tcbId: string,
        unlockAmount: number,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        const contract = this.checkInit(transactionOptions);
        checkIfActionAccountInitialized();

        await TxManager.execute(contract.methods.unlockRewards, [tcbId, unlockAmount], transactionOptions);
    }

    /**
     * Function return last inited TCB of TEE offer
     * @param teeOfferId
     * */
    public static async getInitedTcb(teeOfferId: string): Promise<string> {
        this.checkInit();
        const tcbId = await this.contract.methods.getInitedTcb(teeOfferId).call();
        return tcbId!;
    }

    /**
     * Function return last inited TCB of TEE offer
     * @param teeOfferId
     * */
    public static async getTimeInited(teeOfferId: string): Promise<number> {
        this.checkInit();
        const tcbTimeInited = +(await this.contract.methods.getTimeInited(teeOfferId).call());
        return tcbTimeInited!;
    }
}

export default Consensus;
