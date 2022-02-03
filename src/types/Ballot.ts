import { ContractName, ParamName } from "./Superpro";

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

// Order of keys and type conversion functions for this object in blockchain contract
export const ModifyRequestStructure = {
    requestType: ModifyRequestType,
    contractName: ContractName,
    newContractAddress: String,
    paramName: ParamName,
    newParamValue: Number,
};
export type ModifyRequest = {
    requestType: ModifyRequestType;
    contractName: ContractName;
    newContractAddress: string;
    paramName: ParamName;
    newParamValue: number;
};

// Order of keys and type conversion functions for this object in blockchain contract
export const VoterInfoStructure = {
    voter: String,
    yes: Number,
};
export type VoterInfo = {
    voter: string;
    yes: boolean;
};

// Order of keys and type conversion functions for this object in blockchain contract
export const BallotInfoStructure = {
    issuer: String,
    depositAmount: Number,
    openDate: Number,
    closeDate: Number,
    execDate: Number,
    request: ModifyRequestStructure,
    state: BallotState,
    reason: BallotStateReason,
    totalHoldedVotes: Number,
    quorum: Number,
    yes: Number,
    no: Number,
    voters: [VoterInfoStructure],
};
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
