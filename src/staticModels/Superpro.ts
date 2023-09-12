import { ParamName } from '../types/Superpro';
import BlockchainConnector from '../connectors/BlockchainConnector';
import { Contract } from 'web3-eth-contract';

class Superpro {
    public static address: string;

    /**
     * Fetching address of contract by name
     */
    public static async getContractAddress(): Promise<string> {
        return this.address;
    }

    public static async getTokenAddress(contractInstance?: Contract): Promise<string> {
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
