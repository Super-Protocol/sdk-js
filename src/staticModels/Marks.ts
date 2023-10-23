import { BlockchainConnector } from '../connectors';
import Superpro from './Superpro';
import { Mark } from '../types';

class Marks {
    public static get address(): string {
        return Superpro.address;
    }

    static getProviderMarks(providerId: string): Promise<bigint> {
        const contract = BlockchainConnector.getInstance().getContract();

        return contract.methods.getProviderMarks(providerId).call();
    }

    static getOrderMark(orderId: bigint | number | string): Promise<bigint> {
        const contract = BlockchainConnector.getInstance().getContract();

        return contract.methods.getOrderMark(orderId).call();
    }

    static async setOrderMark(orderId: bigint | number | string, mark: Mark): Promise<void> {
        const contract = BlockchainConnector.getInstance().getContract();

        await contract.methods.setOrderMark(orderId, mark).call();
    }
}

export default Marks;
