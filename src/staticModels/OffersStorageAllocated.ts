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

  public static getByOfferVersion(
    offerId: BlockchainId,
    offerVersion: number = 0,
  ): Promise<OfferStorageAllocated> {
    const contract = BlockchainConnector.getInstance().getContract();

    return contract.methods
      .getStorageOrdersAllocated(offerId, offerVersion)
      .call()
      .then((allocated) => cleanWeb3Data(allocated) as OfferStorageAllocated);
  }
}

export default OffersStorageAllocated;
