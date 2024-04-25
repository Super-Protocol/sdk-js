import { formatBytes32String, parseBytes32String } from 'ethers/lib/utils.js';
import { ContractEvents, DecodedParams } from 'web3';
import BlockchainConnector from '../connectors/BlockchainConnector.js';
import { EventOptions, FilterWithExternalId } from '../types/index.js';
import rootLogger from '../logger.js';
import { cleanWeb3Data, isValidBytes32Hex } from '../utils/helper.js';
import { EventLog } from 'web3-eth-contract';
import abi from '../contracts/abi.js';

interface IObjectWithExternalId {
  externalId: string
}

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

    const parsedEvent = cleanWeb3Data(
      (foundIds[0] as EventLog).returnValues as DecodedParams,
    ) as unknown as IObjectWithExternalId;
    parsedEvent.externalId = parseBytes32String(parsedEvent.externalId);

    return parsedEvent;
  }
}

export default StaticModel;
