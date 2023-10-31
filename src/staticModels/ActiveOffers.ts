import Superpro from './Superpro';
import { BlockchainConnector } from '../connectors';
import { BlockchainId } from '../types';

class ActiveOffers {
  public static get address(): string {
    return Superpro.address;
  }

  public static async getListOfActiveOffersSize(): Promise<number> {
    const contract = BlockchainConnector.getInstance().getContract();

    return Number(await contract.methods.getListOfActiveOffersSize().call());
  }

  public static async getActiveOffersEventsQueueLength(): Promise<number> {
    const contract = BlockchainConnector.getInstance().getContract();

    return Number(await contract.methods.getActiveOffersEventsQueueLength().call());
  }

  /**
   * Function returns ids of active offers (value and TEE)
   * Attention! Check active offers events queue length before calling this function, for actualy status it should be equal to 0.
   * @param begin The first element of range.
   * @param end One past the final element in the range.
   * @returns {Promise<BlockchainId[]>}
   */
  public static async getListOfActiveOffersRange(begin = 0, end = 0): Promise<BlockchainId[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    end = Number(await contract.methods.getListOfActiveOffersSize().call());

    return contract.methods
      .getListOfActiveOffersRange(begin, end)
      .call()
      .then((ids) => ids.map((id) => id.toString()));
  }
}

export default ActiveOffers;
