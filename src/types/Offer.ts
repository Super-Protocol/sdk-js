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

// Order of keys for this object in blockchain contract
export const OfferInfoArguments = [
    "name",
    "group",
    "offerType",
    "cancelable",
    "description",
    "holdSum",
    "restrictions",
    "properties",
    "maxDurationTimeMinutes",
    "inputFormat",
    "outputFormat",
    "allowedArgs",
    "allowedAccounts",
    "argsPublicKey",
    "argsPublicKeyAlgo",
    "resultUrl",
    "disabledAfter",
    "linkage",
    "hash",
    "hashAlgo",
];
export type OfferInfo = {
    name: string;
    group: OfferGroup;
    offerType: OfferType;
    cancelable: boolean;
    description: string;
    holdSum: number;
    restrictions: string[];
    properties: string;
    maxDurationTimeMinutes: number;
    inputFormat: string;
    outputFormat: string;
    allowedArgs: string;
    allowedAccounts: string[];
    argsPublicKey: string;
    argsPublicKeyAlgo: string;
    resultUrl: string;
    disabledAfter: number;
    linkage: string;
    hash: string;
    hashAlgo: string;
};
