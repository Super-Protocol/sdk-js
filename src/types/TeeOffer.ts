// Order of keys for this object in blockchain contract
export const TeeOfferInfoArguments = ["name", "description", "teeType", "slots", "minTimeMinutes", "properties", "tcb"];
export type TeeOfferInfo = {
    name: string;
    description: string;
    teeType: string;
    slots: number;
    minTimeMinutes: number;
    properties: string;
    tcb: string;
};
