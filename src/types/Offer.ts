export enum OfferType {
    TeeOffer = "0",
    Storage = "1",
    Solution = "2",
    Data = "3",
}

export enum OfferGroup {
    Input = "0",
    Processing = "1",
    Output = "2",
}

// Order of keys and type conversion functions for this object in blockchain contract
export const OfferRestrictionsStructure = {
    offers: [String],
    types: [OfferType],
};
export type OfferRestrictions = {
    offers: string[];
    types: OfferType[];
};

// Order of keys and type conversion functions for this object in blockchain contract
export const OfferInfoStructure = {
    name: String,
    group: OfferGroup,
    offerType: OfferType,
    cancelable: Boolean,
    description: String,
    holdSum: String,
    restrictions: OfferRestrictionsStructure,
    properties: String,
    maxDurationTimeMinutes: Number,
    input: String,
    output: String,
    allowedArgs: String,
    allowedAccounts: [String],
    argsPublicKey: String,
    resultUrl: String,
    linkage: String,
    hash: String,
};

export type OfferInfo = {
    name: string;
    group: OfferGroup;
    offerType: OfferType;
    cancelable: boolean;
    description: string;
    holdSum: string;
    restrictions: OfferRestrictions;
    properties: string;
    maxDurationTimeMinutes: number;
    input: string;
    output: string;
    allowedArgs: string;
    allowedAccounts: string[];
    argsPublicKey: string;
    resultResource: string;
    linkage: string;
    hash: string;
};

export type OfferInfoV1 = OfferInfo & {
    disabledAfter?: number;
};
