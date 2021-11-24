import { Contract } from "web3-eth-contract";
import _ from "lodash";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import OfferJSON from "../contracts/Offer.json";
import store from "../store";
import {checkIfActionAccountInitialized, checkIfInitialized, createTransactionOptions} from "../utils";
import { OfferInfo, OfferInfoArguments } from "../types/Offer";
import {TransactionOptions} from "../types/Web3";

class Offer {
    public address: string;
    private contract: Contract;
    private logger: typeof rootLogger;

    public orderInfo?: OfferInfo;
    public provider?: string;

    constructor(address: string) {
        checkIfInitialized();

        this.address = address;
        this.contract = new store.web3!.eth.Contract(<AbiItem[]>OfferJSON.abi, address);

        this.logger = rootLogger.child({ className: "Offer", address });
    }

    /**
     * Function for fetching offer info from blockchain
     */
    public async getInfo(): Promise<OfferInfo> {
        let orderInfoParams = await this.contract.methods.getInfo().call();

        // Converts blockchain array into object
        orderInfoParams = _.zipObject(OfferInfoArguments, orderInfoParams);

        return (this.orderInfo = <OfferInfo>orderInfoParams);
    }

    /**
     * Function for fetching offer provider from blockchain
     */
    public async getProvider(): Promise<string> {
        this.provider = await this.contract.methods.getProvider().call();
        return this.provider!;
    }

    /**
     * Function for disabling offer
     * @param transactionOptions - object what contains alternative action account or gas limit (optional)
     */
    public async disable(transactionOptions?: TransactionOptions) {
        checkIfActionAccountInitialized();

        await this.contract.methods
            .disable()
            .send(createTransactionOptions(transactionOptions));
    }
}

export default Offer;
