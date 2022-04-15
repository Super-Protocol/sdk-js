export enum OfferType {
    TeeOffer = "0",
    Storage = "1",
    Solution = "2",
    Data = "3",
}

export enum OfferGroup {
    Input = "0",
    Output = "1",
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
    holdSum: Number,
    restrictions: OfferRestrictionsStructure,
    properties: String,
    maxDurationTimeMinutes: Number,
    inputFormat: String,
    outputFormat: String,
    allowedArgs: String,
    allowedAccounts: [String],
    argsPublicKey: String,
    resultUrl: String,
    disabledAfter: Number,
    linkage: String,
    hash: String,
};

export const OfferInfoStructureV2 = {
    name: String,
    group: OfferGroup,
    offerType: OfferType,
    cancelable: Boolean,
    description: String,
    holdSum: Number,
    restrictions: OfferRestrictionsStructure,
    properties: String,
    maxDurationTimeMinutes: Number,
    inputFormat: String,
    outputFormat: String,
    allowedArgs: String,
    allowedAccounts: [String],
    argsPublicKey: String,
    resultUrl: String,
    linkage: String,
    hash: String,
    externalId: String,
};

export type OfferInfo = {
    name: string;
    group: OfferGroup;
    offerType: OfferType;
    cancelable: boolean;
    description: string;
    holdSum: number;
    restrictions: OfferRestrictions;
    properties: string;
    maxDurationTimeMinutes: number;
    inputFormat: string;
    outputFormat: string;
    allowedArgs: string;
    allowedAccounts: string[];
    argsPublicKey: string;
    resultUrl: string;
    linkage: string;
    hash: string;
};

export type OfferInfoV1 = OfferInfo & {
    disabledAfter?: number;
};

export type OfferInfoV2 = OfferInfo & {
    externalId?: string;
};
