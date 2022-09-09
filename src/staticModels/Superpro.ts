import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import appJSON from "../contracts/app.json";
import store from "../store";
import { ContractName, ParamName } from "../types/Superpro";
import BlockchainConnector from "../BlockchainConnector";

class Superpro {
    public static address: string;
    private static logger: typeof rootLogger;

    /**
     * Fetching address of contract by name
     */
    public static async getContractAddress(name: ContractName): Promise<string> {
        return this.address;
    }

    public static async getTokenAddress(): Promise<string> {
        const contract = BlockchainConnector.getContractInstance();

        return await contract.methods.getToken().call();
    }

    /**
     * Fetching config parameter value by name
     */
    public static async getParam(name: ParamName): Promise<string> {
        const contract = BlockchainConnector.getContractInstance();

        return await contract.methods.getConfigParam(name).call();
    }
}

export default Superpro;
