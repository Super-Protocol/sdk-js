// Order of keys and type conversion functions for this object in blockchain contract
export const TeeOfferInfoStructure = {
    name: String,
    description: String,
    teeType: String,
    slots: Number,
    minTimeMinutes: Number,
    properties: String,
    tcb: String,
    tlb: String,
    argsPublicKey: String,
    argsPublicKeyAlgo: String,
};
export type TeeOfferInfo = {
    name: string;
    description: string;
    teeType: string;
    slots: number;
    minTimeMinutes: number;
    properties: string;
    tcb: string;
    tlb: string;
    argsPublicKey: string;
    argsPublicKeyAlgo: string;
};
