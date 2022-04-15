import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
// import VotingJSON from "../contracts/Voting.json";
import { checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions } from "../utils";
import { ContractName, ParamName } from "../types/Superpro";
import { TransactionOptions } from "../types/Web3";

class Voting {
    private static contract: Contract;
    private static logger: typeof rootLogger;

    public static ballots?: string[];

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit(transactionOptions?: TransactionOptions) {
        if (transactionOptions?.web3) {
            checkIfInitialized();
            // return new transactionOptions.web3.eth.Contract(<AbiItem[]>VotingJSON.abi, this.address);
        }

        if (this.contract) return this.contract;
        checkIfInitialized();

        this.logger = rootLogger.child({ className: "Voting" });
        // return this.contract = new store.web3!.eth.Contract(<AbiItem[]>VotingJSON.abi, this.address);
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
        transactionOptions?: TransactionOptions,
    ) {
        // TODO: stub
        // const contract = this.checkInit(transactionOptions);
        // checkIfActionAccountInitialized();
        // await contract.methods
        //    .createBallotForAddressUpdate(contractName, newAddress)
        //    .send(await createTransactionOptions(transactionOptions));
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
        transactionOptions?: TransactionOptions,
    ) {
        // TODO: stub
        // const contract = this.checkInit(transactionOptions);
        // checkIfActionAccountInitialized();
        // await contract.methods
        //    .createBallotForParamUpdate(paramName, newValue)
        //    .send(await createTransactionOptions(transactionOptions));
    }

    /**
     * Function for fetching list of all ballots addresses
     */
    public static async getAllBallots(): Promise<string[]> {
        return [];
        // TODO: stub
        // this.checkInit();
        // this.ballots = await this.contract.methods.getBallots().call();
        // return this.ballots!;
    }

    /**
     * Function for fetching list of all ballots for specific user addresses
     * @param userAddress - address of user fpr fetching ballots
     */
    public static async getUserBallots(userAddress: string): Promise<string[]> {
        return [];
        // TODO: stub
        // this.checkInit();
        // return await this.contract.methods.getUserBallots(userAddress).call();
    }
}

export default Voting;
