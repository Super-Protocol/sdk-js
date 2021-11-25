import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import VotingJSON from "../contracts/Voting.json";
import { checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions } from "../utils";
import { ContractName, ParamName } from "../types/Superpro";
import { TransactionOptions } from "../types/Web3";

class Voting {
    public static address: string;
    private static contract: Contract;
    private static logger: typeof rootLogger;

    public static ballots?: string[];

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit() {
        if (this.contract) return;
        checkIfInitialized();

        this.contract = new store.web3!.eth.Contract(<AbiItem[]>VotingJSON.abi, this.address);
        this.logger = rootLogger.child({ className: "Voting", address: this.address });
    }

    /**
     * Creates ballot for replacing contract (updating address of contract in main config contract)
     * @param contractName - name of contract to replace
     * @param newAddress - address of new contract
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async createBallotForAddressUpdate(
        contractName: ContractName,
        newAddress: string,
        transactionOptions?: TransactionOptions
    ) {
        this.checkInit();
        checkIfActionAccountInitialized();

        await this.contract.methods
            .createBallotForAddressUpdate(contractName, newAddress)
            .send(createTransactionOptions(transactionOptions));
    }

    /**
     * Creates ballot for updating params value (in main config contract)
     * @param paramName - data of new provider
     * @param newValue - data of new provider
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public static async createBallotForParamUpdate(
        paramName: ParamName,
        newValue: number,
        transactionOptions?: TransactionOptions
    ) {
        this.checkInit();
        checkIfActionAccountInitialized();

        await this.contract.methods
            .createBallotForParamUpdate(paramName, newValue)
            .send(createTransactionOptions(transactionOptions));
    }

    /**
     * Function for fetching list of all ballots addresses
     */
    public static async getAllBallots(): Promise<string[]> {
        this.checkInit();

        this.ballots = await this.contract.methods.getBallots().call();
        return this.ballots!;
    }

    /**
     * Function for fetching list of all ballots for specific user addresses
     * @param userAddress - address of user fpr fetching ballots
     */
    public static async getUserBallots(userAddress: string): Promise<string[]> {
        this.checkInit();

        return await this.contract.methods.getUserBallots(userAddress).call();
    }
}

export default Voting;
