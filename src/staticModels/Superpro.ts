import { ParamName } from '../types';
import { BlockchainConnector } from '../connectors';
import { Contract, ContractAbi } from 'web3';

class Superpro {
    public static address: string;

    /**
     * Fetching address of contract by name
     */
    public static getContractAddress(): string {
        return this.address;
    }

    public static async getTokenAddress(contractInstance?: Contract<ContractAbi>): Promise<string> {
        const contract = contractInstance || BlockchainConnector.getInstance().getContract();

        return await contract.methods.getToken().call();
    }

    /**
     * Fetching config parameter value by name
     */
    public static async getParam(name: ParamName): Promise<string> {
        const contract = BlockchainConnector.getInstance().getContract();

        return await contract.methods.getConfigParam(name).call();
    }
}

export default Superpro;
