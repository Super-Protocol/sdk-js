import Superpro from './Superpro';
import BlockchainConnector from '../connectors/BlockchainConnector';

class ActiveOffers {
    public static offers?: string[];

    public static get address(): string {
        return Superpro.address;
    }

    public static async getListOfActiveOffersSize(): Promise<bigint> {
        const contract = BlockchainConnector.getInstance().getContract();

        return await contract.methods.getListOfActiveOffersSize().call();
    }

    public static async getActiveOffersEventsQueueLength(): Promise<bigint> {
        const contract = BlockchainConnector.getInstance().getContract();

        return await contract.methods.getActiveOffersEventsQueueLength().call();
    }

    /**
     * Function returns ids of active offers (value and TEE)
     * Attention! Check active offers events queue length before calling this function, for actualy status it should be equal to 0.
     * @param begin The first element of range.
     * @param end One past the final element in the range.
     * @returns {Promise<string[]>}
     */
    public static async getListOfActiveOffersRange(
        begin?: bigint,
        end?: bigint,
    ): Promise<string[]> {
        const contract = BlockchainConnector.getInstance().getContract();

        begin = begin ?? BigInt(0);
        end = end ?? BigInt(await contract.methods.getListOfActiveOffersSize().call()) ?? BigInt(0);

        return await contract.methods.getListOfActiveOffersRange(begin, end).call();
    }
}

export default ActiveOffers;
