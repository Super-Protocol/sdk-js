export enum OfferType {
    TeeOffer = "0",
    Storage = "1",
    Script = "2",
    AdSegment = "3",
}

// Order of keys for this object in blockchain contract
export const OfferInfoArguments = [
    "name",
    "offerType",
    "cancelable",
    "description",
    "holdSum",
    "price",
    "priceUnit",
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
];
export type OfferInfo = {
    name: string;
    offerType: OfferType;
    cancelable: boolean;
    description: string;
    holdSum: number;
    price: number;
    priceUnit: number;
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
};
