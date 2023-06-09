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
    restrictions: OfferRestrictionsStructure,
    input: String,
    output: String,
    allowedArgs: String,
    allowedAccounts: [String],
    argsPublicKey: String,
    resultResource: String,
    linkage: String,
    hash: String,
    metadata: String,
};

export type OfferInfo = {
    name: string;
    group: OfferGroup;
    offerType: OfferType;
    cancelable: boolean;
    description: string;
    restrictions: OfferRestrictions;
    input: string;
    output: string;
    allowedArgs: string;
    allowedAccounts: string[];
    argsPublicKey: string;
    resultResource: string;
    linkage: string;
    hash: string;
    metadata: string;
};
