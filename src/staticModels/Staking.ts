import rootLogger from "../logger";
import { checkIfActionAccountInitialized, tupleToObject } from "../utils";
import { LockInfo, LockInfoStructure, StakeInfo, StakeInfoStructure, Purpose } from "../types/Staking";
import BlockchainConnector from "../BlockchainConnector";
import { TransactionOptions } from "../types/Web3";
import Superpro from "./Superpro";
import TxManager from "../utils/TxManager";

class Staking {
    private static logger: typeof rootLogger;

    public static get address(): string {
        return Superpro.address;
    }

    /**
     * Fetching stake info by owner address from blockchain
     */
    public static async getStakeInfo(ownerAddress: string): Promise<StakeInfo> {
        const contract = BlockchainConnector.getContractInstance();

        const stakeInfoParams = await contract.methods.getStakeInfo(ownerAddress).call();
        return tupleToObject(stakeInfoParams, StakeInfoStructure);
    }

    /**
     * Fetching locked tokens info by owner address and contract name from blockchain
     */
    public static async getLockInfo(purpose: Purpose, ownerAddress: string): Promise<LockInfo> {
        const contract = BlockchainConnector.getContractInstance();

        const lockInfoParams = await contract.methods.getLockedTokensInfo(purpose, ownerAddress).call();
        return tupleToObject(lockInfoParams, LockInfoStructure);
    }

    /**
     * Stakes tokens
     * @param amount - tokens to be staked
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async stake(amount: string, transactionOptions?: TransactionOptions): Promise<void> {
        const contract = BlockchainConnector.getContractInstance(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(contract.methods.stake, [amount], transactionOptions);
    }
}

export default Staking;
