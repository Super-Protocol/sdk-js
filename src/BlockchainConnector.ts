import rootLogger from "./logger";
import Web3 from "web3";
import store from "./store";
import { defaultBlockchainUrl } from "./constants";
import { checkIfInitialized } from "./utils";
import { ContractName } from "./types/Superpro";

import TeeOffersFactory from "./staticModels/TeeOffersFactory";
import OffersFactory from "./staticModels/OffersFactory";
import Superpro from "./staticModels/Superpro";
import OrdersFactory from "./staticModels/OrdersFactory";
import ProviderRegistry from "./staticModels/ProviderRegistry";
import Staking from "./staticModels/Staking";
import SuperproToken from "./staticModels/SuperproToken";
import Voting from "./staticModels/Voting";

class BlockchainConnector {
    private static logger = rootLogger.child({ className: "BlockchainConnector" });

    public static defaultActionAccount?: string;

    /**
     * Function for connecting to blockchain
     * Used to setting up settings for blockchain connector
     * Needs to run this function before using blockchain connector
     */
    public static async init(config: Config) {
        store.web3 = new Web3(config?.blockchainUrl || defaultBlockchainUrl);
        if (config?.gasLimit) store.gasLimit = config.gasLimit;

        Superpro.address = config.contractAddress;

        const addressesToFetch: { name: ContractName; model: { address?: string } }[] = [
            { name: ContractName.TeeOffersFactory, model: TeeOffersFactory },
            { name: ContractName.ValueOffersFactory, model: OffersFactory },
            { name: ContractName.Orders, model: OrdersFactory },
            { name: ContractName.ProviderRegistry, model: ProviderRegistry },
            { name: ContractName.Staking, model: Staking },
            { name: ContractName.Token, model: SuperproToken },
            { name: ContractName.Voting, model: Voting },
        ];
        await Promise.all(
            addressesToFetch.map(async ({ name, model }) => {
                model.address = await Superpro.getContractAddress(name);
            })
        );

        store.isInitialized = true;
    }

    /**
     * Function for connecting provider action account
     * Needs to run this function before using any set methods in blockchain connector
     */
    public static initActionAccount(actionAccountKey: string): string {
        checkIfInitialized();
        const actionAccount = store.web3!.eth.accounts.wallet.add(actionAccountKey).address;
        if (!store.actionAccount) store.actionAccount = actionAccount;
        if (!this.defaultActionAccount) this.defaultActionAccount = actionAccount;
        return actionAccount;
    }
}

export type Config = {
    contractAddress: string;
    blockchainUrl?: string;
    gasLimit?: number;
};

export default BlockchainConnector;
