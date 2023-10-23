import Superpro from './Superpro';
import { BlockchainConnector } from '../connectors';

class ActiveOffers {
    public static get address(): string {
        return Superpro.address;
    }

    public static getListOfActiveOffersSize(): Promise<bigint> {
        const contract = BlockchainConnector.getInstance().getContract();

        return contract.methods.getListOfActiveOffersSize().call();
    }

    public static getActiveOffersEventsQueueLength(): Promise<bigint> {
        const contract = BlockchainConnector.getInstance().getContract();

        return contract.methods.getActiveOffersEventsQueueLength().call();
    }

    /**
     * Function returns ids of active offers (value and TEE)
     * Attention! Check active offers events queue length before calling this function, for actualy status it should be equal to 0.
     * @param begin The first element of range.
     * @param end One past the final element in the range.
     * @returns {Promise<bigint[]>}
     */
    public static async getListOfActiveOffersRange(
        begin?: bigint,
        end?: bigint,
    ): Promise<bigint[]> {
        const contract = BlockchainConnector.getInstance().getContract();

        begin = begin ?? BigInt(0);
        end = end ?? BigInt(await contract.methods.getListOfActiveOffersSize().call()) ?? BigInt(0);

        return contract.methods.getListOfActiveOffersRange(begin, end).call();
    }
}

export default ActiveOffers;
