import { Contract } from "web3-eth-contract";
import _ from "lodash";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import OfferJSON from "../contracts/Offer.json";
import store from "../store";
import { checkIfInitialized } from "../utils";
import { OfferInfo, OfferInfoArguments, OfferRequirementArguments, OfferRequirementsArguments } from "../types/Offer";

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

        // Deep converts blockchain array into object
        orderInfoParams = _.zipObject(OfferInfoArguments, orderInfoParams);
        orderInfoParams.requirements = _.zipObject(OfferRequirementsArguments, orderInfoParams.requirements);
        Object.keys(orderInfoParams.requirements).forEach((key) => {
            orderInfoParams.requirements[key] = _.zipObject(
                OfferRequirementArguments,
                orderInfoParams.requirements[key]
            );
        });

        return (this.orderInfo = <OfferInfo>orderInfoParams);
    }

    /**
     * Function for fetching offer provider from blockchain
     */
    public async getProvider(): Promise<string> {
        this.provider = await this.contract.methods.getProvider().call();
        return this.provider!;
    }
}

export default Offer;
