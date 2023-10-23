import { formatBytes32String } from 'ethers/lib/utils';
import { ContractEvents, DecodedParams } from 'web3';
import BlockchainConnector from '../connectors/BlockchainConnector';
import { EventOptions, FilterWithExternalId } from '../types';
import rootLogger from '../logger';
import { cleanEventData, isValidBytes32Hex } from '../utils/helper';
import { EventLog } from 'web3-eth-contract';
import abi from '../contracts/abi';

class StaticModel {
  private static readonly logger = rootLogger.child({ className: 'Offers' });

  public static async findItemsById(
    eventName: keyof ContractEvents<typeof abi>,
    filter: FilterWithExternalId,
    fromBlock?: number | string,
    toBlock?: number | string,
  ): Promise<unknown> {
    const contract = BlockchainConnector.getInstance().getContract();
    const options: EventOptions = { filter };
    if (!isValidBytes32Hex(filter.externalId)) {
      options.filter!.externalId = formatBytes32String(filter.externalId);
    }
    if (fromBlock) options.fromBlock = fromBlock;
    if (toBlock) options.toBlock = toBlock;

    const foundIds = await contract.getPastEvents(eventName, options);
    if (!foundIds.length) {
      return null;
    }
    if (foundIds.length > 1) {
      StaticModel.logger.warn(
        { eventName, foundIds },
        `More than one item found, please refine your filters!`,
      );
    }

    return cleanEventData((foundIds[0] as EventLog).returnValues as DecodedParams);
  }
}

export default StaticModel;
