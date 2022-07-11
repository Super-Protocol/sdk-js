import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import StakingJSON from "../contracts/Staking.json";
import store from "../store";
import { checkIfActionAccountInitialized, checkIfInitialized, tupleToObject } from "../utils";
import { LockInfo, LockInfoStructure, StakeInfo, StakeInfoStructure, Purpose } from "../types/Staking";
import { ContractName } from "../types/Superpro";
import { Contract } from "web3-eth-contract";
import { TransactionOptions } from "../types/Web3";
import Superpro from "./Superpro";
import TxManager from "../utils/TxManager";

class Staking {
    private static contract: Contract;
    private static logger: typeof rootLogger;

    public static get address(): string {
        return Superpro.address;
    }

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit(transactionOptions?: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();
            return new transactionOptions.web3.eth.Contract(<AbiItem[]>StakingJSON.abi, Superpro.address);
        }

        if (this.contract) return this.contract;
        checkIfInitialized();

        this.logger = rootLogger.child({ className: "Staking" });
        return this.contract = new store.web3!.eth.Contract(<AbiItem[]>StakingJSON.abi, Superpro.address);
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
    public static async getLockInfo(purpose: Purpose, ownerAddress: string): Promise<LockInfo> {
        this.checkInit();

        const lockInfoParams = await this.contract.methods.getLockedTokensInfo(purpose, ownerAddress).call();
        return tupleToObject(lockInfoParams, LockInfoStructure);
    }

    /**
     * Stakes tokens
     * @param amount - tokens to be staked
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async stake(amount: string, transactionOptions?: TransactionOptions): Promise<void> {
        const contract = this.checkInit(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(contract.methods.stake, [amount], transactionOptions);
    }
}

export default Staking;
