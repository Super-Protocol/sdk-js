import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import SuperproJSON from "../contracts/Superpro.json";
import store from "../store";
import { ContractName } from "../types/Superpro";

class Superpro {
    public static address: string;
    private static contract: Contract;
    private static logger: typeof rootLogger;

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit() {
        if (this.contract) return;
        if (!this.address || !store.web3)
            throw new Error(
                "BlockchainConnector is not initialized, needs to run 'await BlockchainConnector.init(CONFIG)' first"
            );

        this.contract = new store.web3!.eth.Contract(<AbiItem[]>SuperproJSON.abi, this.address);
        this.logger = rootLogger.child({ className: "Superpro", address: this.address });
    }

    /**
     * Fetching address of contract by name
     */
    public static async getContractAddress(name: ContractName): Promise<string> {
        this.checkInit();
        try {
            return await this.contract.methods.getAddress(name).call();
        } catch (e) {
            throw new Error("Error: fetching contracts addresses error");
        }
    }
}

export default Superpro;
