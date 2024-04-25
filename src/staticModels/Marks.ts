import { BlockchainConnector } from '../connectors/index.js';
import Superpro from './Superpro.js';
import { BlockchainId, Mark, ProviderMarksCount } from '../types/index.js';
import { cleanWeb3Data } from '../utils/helper.js';

class Marks {
  public static get address(): string {
    return Superpro.address;
  }

  static getProviderMarks(providerId: string): Promise<ProviderMarksCount> {
    const contract = BlockchainConnector.getInstance().getContract();
    return contract.methods
      .getProviderMarks(providerId)
      .call()
      .then((marks) => cleanWeb3Data(marks) as ProviderMarksCount);
  }

  static async getOrderMark(orderId: BlockchainId): Promise<Mark> {
    const contract = BlockchainConnector.getInstance().getContract();

    return (await contract.methods.getOrderMark(orderId).call()) as Mark;
  }

  static async setOrderMark(orderId: BlockchainId, mark: Mark): Promise<void> {
    const contract = BlockchainConnector.getInstance().getContract();

    await contract.methods.setOrderMark(orderId, mark).call();
  }
}

export default Marks;
