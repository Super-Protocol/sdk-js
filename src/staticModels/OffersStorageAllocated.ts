import { BlockchainConnector } from '../connectors/index.js';
import { BlockchainId, OfferStorageAllocated } from '../types/index.js';
import { cleanWeb3Data } from '../utils/helper.js';

class OffersStorageAllocated {
  public getNewStorageOrders(): Promise<BlockchainId[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods.getNewStorageOrders().call();
  }

  public static getUsedStorageOrders(): Promise<BlockchainId[]> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods.getUsedStorageOrders().call();
  }

  public static async getByOfferVersion(
    offerId: BlockchainId,
    offerVersion: number = 0,
  ): Promise<OfferStorageAllocated | undefined> {
    const contract = BlockchainConnector.getInstance().getContract();
    const allocated = await contract.methods
      .getStorageOrdersAllocated(offerId, offerVersion)
      .call()
      .then((allocated) => cleanWeb3Data(allocated) as OfferStorageAllocated);

    if (Number(allocated.timestamp) === 0) {
      return undefined;
    }

    return allocated;
  }
}

export default OffersStorageAllocated;
