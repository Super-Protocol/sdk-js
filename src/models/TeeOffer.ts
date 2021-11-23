import { Contract } from "web3-eth-contract";
import _ from "lodash";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import TeeOfferJSON from "../contracts/TeeOffer.json";
import store from "../store";
import { checkIfInitialized } from "../utils";
import { TeeOfferInfo, TeeOfferInfoArguments } from "../types/TeeOffer";

class TeeOffer {
    public address: string;
    private contract: Contract;
    private logger: typeof rootLogger;

    public orderInfo?: TeeOfferInfo;
    public provider?: string;
    public disabledAfter?: number;

    constructor(address: string) {
        checkIfInitialized();

        this.address = address;
        this.contract = new store.web3!.eth.Contract(<AbiItem[]>TeeOfferJSON.abi, address);

        this.logger = rootLogger.child({ className: "TeeOffer", address });
    }

    /**
     * Function for fetching TEE offer info from blockchain
     */
    public async getInfo(): Promise<TeeOfferInfo> {
        let teeOrderInfoParams = await this.contract.methods.getInfo().call();
        return (this.orderInfo = <TeeOfferInfo>_.zipObject(TeeOfferInfoArguments, teeOrderInfoParams));
    }

    /**
     * Function for fetching TEE offer provider from blockchain
     */
    public async getProvider(): Promise<string> {
        this.provider = await this.contract.methods.getProvider().call();
        return this.provider!;
    }

    /**
     * Function for fetching offer provider from blockchain
     */
    public async getDisabledAfter(): Promise<number> {
        this.disabledAfter = await this.contract.methods.getDisalbedAfter().call();
        return this.disabledAfter!;
    }
}

export default TeeOffer;
