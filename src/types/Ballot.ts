import { ContractName } from "./Superpro";

export enum ModifyRequestType {
    NewContractAddress = "0",
    NewParamValue = "1",
}

export enum BallotState {
    InProgress = "0",
    Applied = "1",
    Rejected = "2",
}

export enum BallotStateReason {
    NoQuorum = "0",
    MajorityDecision = "1",
}

// Order of keys for this object in blockchain contract
export const ModifyRequestArguments = [
    "requestType",
    "contractName",
    "newContractAddress",
    "paramName",
    "newParamValue",
];
export type ModifyRequest = {
    requestType: ModifyRequestType;
    contractName: ContractName;
    newContractAddress: number;
    paramName: number;
    newParamValue: number;
};

// Order of keys for this object in blockchain contract
export const VoterInfoArguments = ["voter", "yes"];
export type VoterInfo = {
    voter: string;
    yes: boolean;
};

// Order of keys for this object in blockchain contract
export const BallotInfoArguments = [
    "issuer",
    "depositAmount",
    "openDate",
    "closeDate",
    "execDate",
    "request",
    "state",
    "reason",
    "totalHoldedVotes",
    "quorum",
    "yes",
    "no",
    "voters",
];
export type BallotInfo = {
    issuer: string;
    depositAmount: number;
    openDate: number;
    closeDate: number;
    execDate: number;
    request: ModifyRequest;
    state: BallotState;
    reason: BallotStateReason;
    totalHoldedVotes: number;
    quorum: number;
    yes: number;
    no: number;
    voters: VoterInfo[];
};
