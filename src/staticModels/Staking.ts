import _ from "lodash";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import StakingJSON from "../contracts/Staking.json";
import store from "../store";
import {checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions, tupleToObject} from "../utils";
import { LockInfo, LockInfoStructure, StakeInfo, StakeInfoStructure } from "../types/Staking";
import { ContractName } from "../types/Superpro";
import { Contract } from "web3-eth-contract";
import { TransactionOptions } from "../types/Web3";

class Staking {
    public static address: string;
    private static contract: Contract;
    private static logger: typeof rootLogger;

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit() {
        if (this.contract) return;
        checkIfInitialized();

        this.contract = new store.web3!.eth.Contract(<AbiItem[]>StakingJSON.abi, this.address);
        this.logger = rootLogger.child({ className: "Staking", address: this.address });
    }

    /**
     * Fetching stake info by owner address from blockchain
     */
    public static async getStakeInfo(ownerAddress: string): Promise<StakeInfo> {
        this.checkInit();

        const stakeInfoParams = await this.contract.methods.getStakeInfo(ownerAddress).call();
        return tupleToObject(stakeInfoParams, StakeInfoStructure);
    }

    /**
     * Fetching locked tokens info by owner address and contract name from blockchain
     */
    public static async getLockInfo(ownerAddress: string, contractName: ContractName): Promise<LockInfo> {
        this.checkInit();

        const lockInfoParams = await this.contract.methods.getLockInfo(ownerAddress, contractName).call();
        return tupleToObject(lockInfoParams, LockInfoStructure);
    }

    /**
     * Stakes tokens
     * @param amount - number of tokens to be staked
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async stake(amount: number, transactionOptions?: TransactionOptions): Promise<void> {
        this.checkInit();
        checkIfActionAccountInitialized();
        await this.contract.methods.stake(amount).send(createTransactionOptions(transactionOptions));
    }
}

export default Staking;
