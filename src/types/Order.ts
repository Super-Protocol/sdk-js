export enum OrderStatus {
    New = "0",
    Processing = "1",
    Canceling = "2",
    Canceled = "3",
    Done = "4",
    Error = "5",
    Blocked = "6",
    Suspended = "7",
}

// Order of keys and type conversion functions for this object in blockchain contract
export const OrderArgsStructure = {
    slots: Number,
    inputOffers: [String],
    selectedOffers: [String],
};
export type OrderArgs = {
    slots: number;
    inputOffers: string[];
    selectedOffers: string[];
};

// Order of keys and type conversion functions for this object in blockchain contract
export const OrderInfoStructure = {
    offer: String,
    resultPublicKey: String,
    encryptedRequirements: String,
    encryptedArgs: String,
    status: OrderStatus,
    args: OrderArgsStructure,
};
export type OrderInfo = {
    offer: string;
    resultPublicKey: string;
    encryptedRequirements: string;
    encryptedArgs: string;
    status: OrderStatus;
    args: OrderArgs;
};

// Order of keys and type conversion functions for this object in blockchain contract
export const OrderResultStructure = {
    encryptedResult: String,
    orderPrice: Number,
};
export type OrderResult = {
    encryptedResult: string;
    orderPrice: number;
};

export type SubOrderParams = {
    blockParentOrder: Boolean;
    externalId: string;
    holdSum: number;
}
