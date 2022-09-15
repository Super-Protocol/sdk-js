import { ContractName, ParamName } from "../types/Superpro";
import BlockchainConnector from "../BlockchainConnector";

class Superpro {
    public static address: string;

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
