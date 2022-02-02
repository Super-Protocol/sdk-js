import { Contract } from "web3-eth-contract";
import _ from "lodash";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import TcbJSON from "../contracts/TCB.json";
import store from "../store";
import { PublicData, LType, TcbEpochInfo } from "../types/TcbData";
import { checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions } from "../utils";
import { TransactionOptions } from "../types/Web3";
import Suspicious from "../staticModels/Suspicious";
import LastBlocks from "../staticModels/LastBlocks";
import { formatBytes32String } from 'ethers/lib/utils';

class TCB {
    public address: string;
    private contract: Contract;
    private logger: typeof rootLogger;

    public L1?: string[];
    public L2?: string[];
    public L1_statusess?: number[];
    public L2_statusess?: number[];
    public epoch?: TcbEpochInfo;
    public positive?: number;
    public negative?: number;
    public quote?: string;

    constructor(address: string) {
        checkIfInitialized();

        this.address = address;
        this.contract = new store.web3!.eth.Contract(<AbiItem[]>TcbJSON.abi, address);

        this.logger = rootLogger.child({ className: "TCB", address });
    }

    /**
     * Function for fetching number of TCB's to request for verifying from LastBlocksTable
     */
    public async needL1toCompleted(): Promise<number> {
        const lbtSzie = await LastBlocks.count();
        const l1Completed = await this.contract.methods.needL1toCompleted(lbtSzie).call();
        return l1Completed;
    }

    /**
     * Function for fetching number of TCB's to request for verifying from SuspiciousBlocksTable
     */
    public async needL2toCompleted(): Promise<number> {
        const sbtSize = await Suspicious.count();
        const l2Completed = await this.contract.methods.needL2toCompleted(sbtSize).call();
        return l2Completed;
    }

    /**
     * Function for fetching list of TCBs from LastBlocksTable formed for veirifying
     */
    public async getL1(): Promise<string[]> {
        this.L1 = await this.contract.methods.getL1().call();
        return this.L1!;
    }

    /**
     * Function for fetching list of TCBs from SuspiciousBlocksTable formed for veirifying
     */
    public async getL2(): Promise<string[]> {
        this.L2 = await this.contract.methods.getL2().call();
        return this.L2!;
    }

    /**
     * Function for fetching the given marks for recruited TCBs from the LastBlocksTable
     */
    public async getL1Marks(): Promise<number[]> {
        this.L1_statusess = await this.contract.methods.getL1Marks().call();
        return this.L1_statusess!;
    }

    /**
     * Function for fetching the given marks for recruited TCBs from the SuspiciousBlocksTable
     */
    public async getL2Marks(): Promise<number[]> {
        this.L2_statusess = await this.contract.methods.getL2Marks().call();
        return this.L2_statusess!;
    }

    /**
     * Add processed TCB data to smart-contract
     * @param used - struct of 'processed' data
     * @param quote - data generated from Enclave
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async addData(pb: PublicData, quote: string, transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        const fromattedDeviceId = formatBytes32String((Buffer.from(pb.deviceID, 'hex')).toString('base64'));

        await this.contract.methods
            .addData(pb.benchmark, pb.properties, fromattedDeviceId, quote)
            .send(createTransactionOptions(transactionOptions));
    }

    public async getEpochInfo(): Promise<TcbEpochInfo> {
        this.epoch = await this.contract.methods.getEpochInfo().call();
        return this.epoch!;
    }

    /**
     * Function for fetching marks of TCB (from Consensus)
     */
    public async getOwnMarks(): Promise<{ positive: number; negative: number }> {
        const [positive, negative] = await this.contract.methods.getOwnMarks().call();
        this.positive = positive;
        this.negative = negative;
        return { positive, negative };
    }

    /**
     * Function for fetching used TCB data
     */
    public async getPublicData(): Promise<PublicData> {
        let publicData = await this.contract.methods.getPublicData().call();

        const { deviceID } = publicData;
        const formattedDeviceId = (Buffer.from(deviceID, 'base64')).toString('hex');
        publicData.deviceID = formattedDeviceId;

        return publicData;
    }

    /**
     * Function for fetching stored TCB data
     */
    public async getQuote(): Promise<string> {
        this.quote = await this.contract.methods.getQuote().call();
        return this.quote!;
    }

    /**
     * Append marks for selected TCBs
     * @param lType - type of appending marks
     * @param marks - list of marks
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async addMarks(lType: LType, marks: number[], transactionOptions?: TransactionOptions): Promise<void> {
        checkIfActionAccountInitialized();

        if (marks.length > 0) {
            await this.contract.methods.addMarks(lType, marks).send(createTransactionOptions(transactionOptions));
        } // else nothing
    }
}

export default TCB;
