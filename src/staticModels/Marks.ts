import BlockchainConnector from '../connectors/BlockchainConnector';
import Superpro from './Superpro';
import { Mark } from '../types/Marks';

class Marks {
    public static get address(): string {
        return Superpro.address;
    }

    static async getProviderMarks(providerAddress: string) {
        const contract = BlockchainConnector.getInstance().getContract();

        await contract.methods.getProviderMarks(providerAddress).call();
    }

    static async getOrderMark(orderId: string) {
        const contract = BlockchainConnector.getInstance().getContract();

        await contract.methods.getOrderMark(orderId).call();
    }

    static async setOrderMark(orderId: string, mark: Mark) {
        const contract = BlockchainConnector.getInstance().getContract();

        await contract.methods.setOrderMark(orderId, mark).call();
    }
}

export default Marks;
