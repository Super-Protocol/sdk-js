import { ParamName } from '../types';
import { BlockchainConnector } from '../connectors';
import { Contract } from 'web3';
import abi from '../contracts/abi';

class Superpro {
  public static address: string;

  /**
   * Fetching address of contract by name
   */
  public static getContractAddress(): string {
    return this.address;
  }

  public static getTokenAddress(contractInstance?: Contract<typeof abi>): Promise<string> {
    const contract = contractInstance || BlockchainConnector.getInstance().getContract();

    return contract.methods.getToken().call();
  }

  /**
   * Fetching config parameter value by name
   */
  public static getParam(name: ParamName): Promise<string> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods.getConfigParam(name).call();
  }
}

export default Superpro;
