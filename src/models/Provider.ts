import { Contract } from "web3-eth-contract";
import _ from "lodash";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import ProviderJSON from "../contracts/Provider.json";
import store from "../store";
import { checkIfInitialized } from "../utils";
import { ProviderInfo, ProviderInfoArguments } from "../types/Provider";

class Provider {
    public address: string;
    private contract: Contract;
    private logger: typeof rootLogger;

    public providerInfo?: ProviderInfo;
    public authority?: string;
    public valueOffers?: string[];
    public teeOffers?: string[];

    constructor(address: string) {
        checkIfInitialized();

        this.address = address;
        this.contract = new store.web3!.eth.Contract(<AbiItem[]>ProviderJSON.abi, address);

        this.logger = rootLogger.child({ className: "Provider", address });
    }

    /**
     * Function for fetching provider info from blockchain
     */
    public async getInfo(): Promise<ProviderInfo> {
        let providerInfoParams = await this.contract.methods.getInfo().call();
        return (this.providerInfo = <ProviderInfo>_.zipObject(ProviderInfoArguments, providerInfoParams));
    }

    /**
     * Function for fetching provider authority address from blockchain
     */
    public async getAuthority(): Promise<string> {
        this.authority = await this.contract.methods.getAuth().call();
        return this.authority!;
    }

    /**
     * Function for fetching all value offers for this provider
     */
    public async getValueOffers(): Promise<string[]> {
        this.valueOffers = await this.contract.methods.getValueOffers().call();
        return this.valueOffers!;
    }

    /**
     * Function for fetching all TEE offers for this provider
     */
    public async getTeeOffers(): Promise<string[]> {
        this.teeOffers = await this.contract.methods.getTeeOffers().call();
        return this.teeOffers!;
    }
}

export default Provider;
