import { checkIfActionAccountInitialized, tupleToObject } from "../utils";
import { LockInfo, LockInfoStructure, StakeInfo, StakeInfoStructure, Purpose } from "../types/Staking";
import BlockchainConnector from "../connectors/BlockchainConnector";
import { TransactionOptions } from "../types/Web3";
import Superpro from "./Superpro";
import TxManager from "../utils/TxManager";

class Staking {
    public static get address(): string {
        return Superpro.address;
    }

    /**
     * Fetching stake info by owner address from blockchain
     */
    public static async getStakeInfo(ownerAddress: string): Promise<StakeInfo> {
        const contract = BlockchainConnector.getInstance().getContract();

        const stakeInfoParams = await contract.methods.getStakeInfo(ownerAddress).call();
        return tupleToObject(stakeInfoParams, StakeInfoStructure);
    }

    /**
     * Fetching locked tokens info by owner address and contract name from blockchain
     */
    public static async getLockInfo(purpose: Purpose, ownerAddress: string): Promise<LockInfo> {
        const contract = BlockchainConnector.getInstance().getContract();

        const lockInfoParams = await contract.methods.getLockedTokensInfo(purpose, ownerAddress).call();
        return tupleToObject(lockInfoParams, LockInfoStructure);
    }

    /**
     * Stakes tokens
     * @param amount - tokens to be staked
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async stake(amount: string, transactionOptions?: TransactionOptions): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract(transactionOptions);
        checkIfActionAccountInitialized(transactionOptions);

        await TxManager.execute(contract.methods.stake, [amount], transactionOptions);
    }
}

export default Staking;
