import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import ConsensusJSON from "../contracts/Consensus.json";
import TCB from "../models/TCB";
import LastBlocks from "./LastBlocks";
import Suspicious from "./Suspicious";
import { checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions } from "../utils";
import { zeroAddress } from "../constants";
import { PublicData, LType } from "../types/TcbData";
import _ from "lodash";
import { TransactionOptions } from "../types/Web3";

class Consensus {
    public static address: string;
    private static contract: Contract;
    private static logger: typeof rootLogger;

    public static LEnough = async (tcb: TCB) => {
        return +(await tcb.needL1toCompleted()) === 0 && +(await tcb.needL2toCompleted()) === 0;
    };
    public static offers?: string[];

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit() {
        if (this.contract) return;
        checkIfInitialized();

        this.contract = new store.web3!.eth.Contract(<AbiItem[]>ConsensusJSON.abi, this.address);
        this.logger = rootLogger.child({ className: "Consensus", address: this.address });
    }

    private static async initTcb(teeOfferAddress: string, transactionOptions?: TransactionOptions): Promise<TCB> {
        await this.contract.methods.initTcb(teeOfferAddress).send(createTransactionOptions(transactionOptions));

        const tcbAddress = await this.getInitedTcb(teeOfferAddress);
        return new TCB(tcbAddress);
    }

    private static async addToSupply(tcbAddress: string, transactionOptions?: TransactionOptions) {
        await this.contract.methods.addToSupply(tcbAddress).send(createTransactionOptions(transactionOptions));
    }

    /**
     * Function initialize TCB and returns two lists of anothers' TCB addresses for their checking
     * @param teeOfferAddress
     * @returns two lists of anothers' TCB addresses for their checking
     */
    public static async getListsForVerification(
        teeOfferAddress: string,
        transactionOptions?: TransactionOptions
    ): Promise<{ L1: string[]; L2: string[] }> {
        this.checkInit();
        checkIfActionAccountInitialized();

        const alreadyInited = await this.getInitedTcb(teeOfferAddress);
        const tcb =
            alreadyInited === zeroAddress
                ? await this.initTcb(teeOfferAddress, transactionOptions)
                : new TCB(alreadyInited);

        if (!(await this.LEnough(tcb))) {
            // counted how many L2 are missing to complete TCB
            const numberOfMissingL2 = +(await tcb.needL2toCompleted());

            await LastBlocks.getRandomL1(tcb.address, transactionOptions);
            await Suspicious.getRandomL2(tcb.address, numberOfMissingL2, transactionOptions);
        }

        const L1 = await tcb.getL1();
        const L2 = await tcb.getL2();

        return { L1, L2 };
    }

    /**
     * Add data to TeeConfirmationBlock and push it to Consensus
     * @param teeOfferAddress - TCB's device offer, as key
     * @param L1 - marks of LastBlocks
     * @param L2 - marks of SuspiciousBlocks
     * @param TcbData - TEE generated
     */
    public static async addTCB(
        teeOfferAddress: string,
        L1: number[],
        L2: number[],
        tcbData: { publicData: PublicData; quote: string },
        transactionOptions?: TransactionOptions
    ): Promise<void> {
        this.checkInit();
        checkIfActionAccountInitialized();
        const logger = this.logger.child({ method: "addTCB" });

        const tcb = new TCB(await this.getInitedTcb(teeOfferAddress));
        if (!(await this.LEnough(tcb))) logger.error("L is not enough to complite TCB");

        // Can be upgraded to completion of TCB
        await tcb.addData(tcbData.publicData, tcbData.quote, transactionOptions);

        await tcb.addMarks(LType.L1, L1, transactionOptions);
        await tcb.addMarks(LType.L2, L2, transactionOptions);

        await this.addToSupply(tcb.address, transactionOptions);
    }

    /**
     * Function stake and lock TCB's reward
     * @param tcbAddress - TEE Offer's completed and valid TCB contract
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async claimRewards(tcbAddress: string, transactionOptions?: TransactionOptions): Promise<void> {
        this.checkInit();

        await this.contract.methods.claimRewards(tcbAddress).send(createTransactionOptions(transactionOptions));
    }

    /**
     * Function unlock previously locked TCB rewards (by claimRewards)
     * @param tcbAddress - TCB contract address
     * @param unlockAmount - amount of tokens to unlock, max available amount = TeeOffer.getLockInfo(tcbAddress)
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async unlockRewards(
        tcbAddress: string,
        unlockAmount: number,
        transactionOptions?: TransactionOptions
    ): Promise<void> {
        this.checkInit();
        checkIfActionAccountInitialized();

        await this.contract.methods
            .unlockRewards(tcbAddress, unlockAmount)
            .send(createTransactionOptions(transactionOptions));
    }

    /**
     * Function return last inited TCB of TEE offer
     * @param teeOfferAddress
     * */
    public static async getInitedTcb(teeOfferAddress: string): Promise<string> {
        this.checkInit();
        const tcbAddress = await this.contract.methods.getInitedTcb(teeOfferAddress).call();
        return tcbAddress!;
    }
}

export default Consensus;
