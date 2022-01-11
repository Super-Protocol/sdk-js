import store from "../store";
import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import EpochsJSON from "../contracts/Epochs.json";
import { checkIfInitialized } from "../utils";
import { Epoch } from "../types/Epoch";

class Epochs {
    public static address: string;
    private static contract: Contract;
    private static logger: typeof rootLogger;

    /**
     * Checks if contract has been initialized, if not - initialize contract
     */
    private static checkInit() {
        if (this.contract) return;
        checkIfInitialized();

        this.contract = new store.web3!.eth.Contract(<AbiItem[]>EpochsJSON.abi, this.address);
        this.logger = rootLogger.child({ className: "Epochs", address: this.address });
    }

    /**
     * Function for fetching epoch info by index
     */
     public static async getEpoch(index: number): Promise<Epoch> {
        this.checkInit();

        return await this.contract.methods.getEpoch(index).call();
    }

    /**
     * Function for fetching TCB last blocks list size
     */
    public static async count(): Promise<number> {
        this.checkInit();

        return await this.contract.methods.count().call();
    }
}

export default Epochs;
