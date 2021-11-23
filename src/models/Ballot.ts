import { Contract } from "web3-eth-contract";
import _ from "lodash";
import rootLogger from "../logger";
import { AbiItem } from "web3-utils";
import BallotJSON from "../contracts/Ballot.json";
import store from "../store";
import { checkIfInitialized } from "../utils";
import { BallotInfo, BallotInfoArguments, ModifyRequestArguments, VoterInfoArguments } from "../types/Ballot";

class Ballot {
    public address: string;
    private contract: Contract;
    private logger: typeof rootLogger;

    public ballotInfo?: BallotInfo;

    constructor(address: string) {
        checkIfInitialized();

        this.address = address;
        this.contract = new store.web3!.eth.Contract(<AbiItem[]>BallotJSON.abi, address);

        this.logger = rootLogger.child({ className: "Ballot", address });
    }

    /**
     * Function for fetching order info from blockchain
     */
    public async getBallotInfo(): Promise<BallotInfo> {
        let ballotInfoParams = await this.contract.methods.getInfo().call();

        // Deep converts blockchain array into object
        ballotInfoParams = _.zipObject(BallotInfoArguments, ballotInfoParams);
        ballotInfoParams.request = _.zipObject(ModifyRequestArguments, ballotInfoParams.request);
        ballotInfoParams.voters = ballotInfoParams.voters.map((voterInfo: any[]) =>
            _.zipObject(VoterInfoArguments, voterInfo)
        );

        return (this.ballotInfo = <BallotInfo>ballotInfoParams);
    }
}

export default Ballot;
