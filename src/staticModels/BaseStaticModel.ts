import { Filter } from "web3-types";
import { EventLog } from "web3-eth-contract";
import BlockchainConnector from "../connectors/BlockchainConnector";

export abstract class StaticModel {
    static getPastEvents(eventName: string, filter: Filter): Promise<string | EventLog>[] {
        const contract = BlockchainConnector.getInstance().getContract();

        return contract.getPastEvents(eventName, filter);
    }
}
