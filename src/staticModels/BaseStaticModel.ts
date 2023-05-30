import { PastEventOptions, Filter } from "web3-eth-contract";
import BlockchainConnector from "../connectors/BlockchainConnector";

export abstract class StaticModel {
    static getPastEvents(eventName: string, filter: Filter, fromBlock?: number | string, toBlock?: number | string) {
        const contract = BlockchainConnector.getInstance().getContract();
        const options: PastEventOptions = { filter };

        if (fromBlock) options.fromBlock = fromBlock;
        if (toBlock) options.toBlock = toBlock;

        return contract.getPastEvents(eventName, options);
    }
}
