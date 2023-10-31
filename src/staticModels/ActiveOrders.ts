import Superpro from './Superpro';
import { BlockchainConnector } from '../connectors';
import { convertBigIntToString, incrementMethodCall } from '../utils/helper';
import { BlockchainId } from '../types';

class ActiveOrders {
  public static get address(): string {
    return Superpro.address;
  }

  /**
   * Function returns amount of active orders
   * @returns {Promise<number>}
   */
  @incrementMethodCall()
  public static async getListOfActiveOrdersSize(): Promise<number> {
    const contract = BlockchainConnector.getInstance().getContract();

    return Number(await contract.methods.getListOfActiveOrdersSize().call());
  }

  /**
   * Function returns ids of active orders
   * @returns {Promise<BlockchainId[]>}
   */
  @incrementMethodCall()
  public static async getListOfActiveOrdersRange(
    begin?: number,
    end?: number,
  ): Promise<BlockchainId[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    begin = begin ?? 0;
    end = end ?? (await ActiveOrders.getListOfActiveOrdersSize());

    return contract.methods
      .getListOfActiveOrdersRange(begin, end)
      .call()
      .then((ids) => ids.map((id) => id.toString()));
  }

  /**
   * Function returns ids of active orders by offers
   * @returns {Promise<BlockchainId[]>}
   */
  @incrementMethodCall()
  public static async getActiveOrdersRangeByOffers(
    offerIds: BlockchainId[],
    begin = 0,
    end = 999,
  ): Promise<BlockchainId[]> {
    const contract = BlockchainConnector.getInstance().getContract();
    const response: BlockchainId[] = [];

    for (const offerId in offerIds) {
      const activeOrders = convertBigIntToString(
        await contract.methods.getOfferActiveOrdersRange(offerId, begin, end).call(),
      );
      response.push(activeOrders);
    }

    return response;
  }
}

export default ActiveOrders;
