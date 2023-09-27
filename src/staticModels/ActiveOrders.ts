import Superpro from './Superpro';
import { BigNumber } from 'ethers';
import BlockchainConnector from '../connectors/BlockchainConnector';
import { incrementMethodCall } from '../utils';

class ActiveOrders {
    public static get address(): string {
        return Superpro.address;
    }

    /**
     * Function returns amount of active orders
     * @returns {Promise<BigNumber>}
     */
    @incrementMethodCall()
    public static async getListOfActiveOrdersSize(): Promise<BigNumber> {
        const contract = BlockchainConnector.getInstance().getContract();

        return await contract.methods.getListOfActiveOrdersSize().call();
    }

    /**
     * Function returns ids of active orders
     * @returns {Promise<string[]>}
     */
    @incrementMethodCall()
    public static async getListOfActiveOrdersRange(
        begin?: bigint,
        end?: bigint,
    ): Promise<string[]> {
        const contract = BlockchainConnector.getInstance().getContract();

        begin = begin ?? BigInt(0);
        end = end ?? BigInt(await contract.methods.getListOfActiveOrdersSize().call());

        return await contract.methods.getListOfActiveOrdersRange(begin, end).call();
    }

    /**
     * Function returns ids of active orders by offers
     * @returns {Promise<string[]>}
     */
    @incrementMethodCall()
    public static async getActiveOrdersRangeByOffers(
        offerIds: bigint[],
        begin?: bigint,
        end?: bigint,
    ): Promise<bigint[]> {
        const contract = BlockchainConnector.getInstance().getContract();
        const response: bigint[] = [];

        begin = begin ?? BigInt(0);
        end = end ?? BigInt(999); // max active orders for one offer

        for (const offerId in offerIds) {
            const activeOrders = BigInt(
                await contract.methods.getOfferActiveOrdersRange(offerId, begin, end).call(),
            );
            response.push(activeOrders);
        }

        return response;
    }
}

export default ActiveOrders;
