import { Contract } from "web3-eth-contract";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
// import BallotJSON from "../contracts/Ballot.json";
import OffersJSON from "../contracts/Offers.json";
import store from "../store";
import { checkIfInitialized, tupleToObject } from "../utils";
import { BallotInfo, BallotInfoStructure } from "../types/Ballot";
import Superpro from "../staticModels/Superpro";

class Ballot {
    public address: string;
    private contract: Contract;
    private logger: typeof rootLogger;

    public ballotInfo?: BallotInfo;

    constructor(address: string) {
        checkIfInitialized();

        this.address = address;
        // this.contract = new store.web3!.eth.Contract(<AbiItem[]>BallotJSON.abi, address);
        // TODO: stub
        this.contract = new store.web3!.eth.Contract(<AbiItem[]>OffersJSON.abi, Superpro.address);

        this.logger = rootLogger.child({ className: "Ballot", address });
    }

    /**
     * Function for fetching order info from blockchain
     */
    public async getBallotInfo(): Promise<BallotInfo> {
        let ballotInfoParams = await this.contract.methods.getInfo().call();
        return (this.ballotInfo = tupleToObject(ballotInfoParams, BallotInfoStructure));
    }
}

export default Ballot;
