import { Contract } from "web3-eth-contract";
import _ from "lodash";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import TcbJSON from "../contracts/TCB.json";
import store from "../store";
import { UsedData, StoredData, LType, LStatus } from "../types/TcbData";
import { checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions } from "../utils";
import { TransactionOptions } from "../types/Web3";
import Suspicious from "../staticModels/Suspicious";
import LastBlocks from "../staticModels/LastBlocks";

class TCB {
    public address: string;
    private contract: Contract;
    private logger: typeof rootLogger;

    public L1?: string[];
    public L2?: string[];
    public L1_statusess?: LStatus[];
    public L2_statusess?: LStatus[];
    public positive?: number;
    public negative?: number;
    public usedData?: UsedData;
    public storedData?: StoredData;

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
    public async getL1Marks(): Promise<LStatus[]> {
        this.L1_statusess = await this.contract.methods.getL1Marks().call();
        return this.L1_statusess!;
    }

    /**
     * Function for fetching the given marks for recruited TCBs from the SuspiciousBlocksTable
     */
    public async getL2Marks(): Promise<LStatus[]> {
        this.L2_statusess = await this.contract.methods.getL2Marks().call();
        return this.L2_statusess!;
    }

    //TODO:
    /**
     * Add processed TCB data to smart-contract
     * @param used - struct of 'processed' data
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async addUsedData(used: UsedData, transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();
        await this.contract.methods
            .addUsedData(used.benchmark, used.properties, used.deviceID)
            .send(createTransactionOptions(transactionOptions));
    }

    /**
     * Add only stored TCB data to smart-contract
     * @param stored - struct of 'only stored' data
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async addStoredData(stored: StoredData, transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();
        await this.contract.methods.addStoredData(stored).send(createTransactionOptions(transactionOptions));
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
    public async getUsedData(): Promise<UsedData> {
        this.usedData = await this.contract.methods.getUsedData().call();
        return this.usedData!;
    }

    /**
     * Function for fetching stored TCB data
     */
    public async getStoredData(): Promise<StoredData> {
        this.storedData = await this.contract.methods.getStoredData().call();
        return this.storedData!;
    }

    /**
     * Append marks for selected TCBs
     * @param lType - type of appending marks
     * @param marks - list of marks
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async addMarks(lType: LType, marks: LStatus[], transactionOptions?: TransactionOptions): Promise<void> {
        checkIfActionAccountInitialized();

        if (marks.length > 0) {
            await this.contract.methods.addMarks(lType, marks).send(createTransactionOptions(transactionOptions));
        } // else nothing
    }
}

export default TCB;
