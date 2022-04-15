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
};

export const TeeOfferInfoStructureV2 = {
    name: String,
    description: String,
    teeType: String,
    slots: Number,
    minTimeMinutes: Number,
    properties: String,
    tcb: String,
    tlb: String,
    argsPublicKey: String,
    externalId: String,
};

export type TeeOfferInfoV2 = TeeOfferInfo & {
    externalId?: string;
};
