import { BlockchainConnector } from '../connectors/index.js';
import { BlockchainId, OfferStorageAllocated } from '../types/index.js';
import { convertOfferStorageAllocatedFromRaw } from '../utils/helper.js';

class OffersStorageAllocated {
  public static async getByOfferVersion(
    offerId: BlockchainId,
    offerVersion: number = 0,
  ): Promise<OfferStorageAllocated | undefined> {
    const contract = BlockchainConnector.getInstance().getContract();
    const allocated = await contract.methods
      .getStorageOrdersAllocated(offerId, offerVersion)
      .call()
      .then((allocated) => convertOfferStorageAllocatedFromRaw(allocated as OfferStorageAllocated));

    if (Number(allocated.timestamp) === 0) {
      return undefined;
    }

    return allocated;
  }

  public static async getByIssuerId(teeOfferIssuerId: BlockchainId): Promise<OfferStorageAllocated[]> {
    const contract = BlockchainConnector.getInstance().getContract();
    const allocated = await contract.methods
      .getStorageOrdersAllocatedByIssuer(teeOfferIssuerId)
      .call()
      .then((allocatedOffers: unknown[] | void) =>
        allocatedOffers!.map((allocated) => convertOfferStorageAllocatedFromRaw(allocated as OfferStorageAllocated)),
      );

    return allocated;
  }
}

export default OffersStorageAllocated;
