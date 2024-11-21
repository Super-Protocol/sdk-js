import { ParamName, TokenInfo, TransactionOptions } from '../types/index.js';
import { BlockchainConnector } from '../connectors/index.js';
import { Contract, TransactionReceipt } from 'web3';
import abi from '../contracts/abi.js';
import { checkIfActionAccountInitialized, incrementMethodCall } from '../utils/helper.js';
import TxManager from '../utils/TxManager.js';

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

  public static isTokenExists(tokenContractAddress: string): Promise<TokenInfo[]> {
    const contract = BlockchainConnector.getInstance().getContract();
    return contract.methods.isTokenExists(tokenContractAddress).call();
  }

  public static getTokens(): Promise<TokenInfo[]> {
    const contract = BlockchainConnector.getInstance().getContract();
    return contract.methods.getTokens().call();
  }

  @incrementMethodCall()
  public static async addTokens(
    newTokens: TokenInfo[],
    transactionOptions?: TransactionOptions,
    checkTxBeforeSend = false,
  ): Promise<TransactionReceipt> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    if (checkTxBeforeSend) {
      await TxManager.dryRun(contract.methods.addTokens(newTokens), transactionOptions);
    }

    return await TxManager.execute(contract.methods.addTokens(newTokens), transactionOptions);
  }

  @incrementMethodCall()
  public static async removeTokens(
    tokensAddresses: string[],
    transactionOptions?: TransactionOptions,
    checkTxBeforeSend = false,
  ): Promise<TransactionReceipt> {
    const contract = BlockchainConnector.getInstance().getContract();
    checkIfActionAccountInitialized(transactionOptions);

    if (checkTxBeforeSend) {
      await TxManager.dryRun(contract.methods.removeTokens(tokensAddresses), transactionOptions);
    }

    return await TxManager.execute(
      contract.methods.removeTokens(tokensAddresses),
      transactionOptions,
    );
  }
}

export default Superpro;
