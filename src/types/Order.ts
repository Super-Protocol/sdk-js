export enum OrderStatus {
    New = "0",
    Processing = "1",
    Canceling = "2",
    Canceled = "3",
    Done = "4",
    Error = "5",
    Blocked = "6",
    Suspended = "7",
    AwaitingPayment = "8", // TODO Remove
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
export type ExtendedOrderInfo = OrderInfo & {
    blocking: boolean;
    externalId: string;
    holdSum: string;
};

// Array of order info structures
export const OrderInfoStructureArray = [];

// Order of keys and type conversion functions for this object in blockchain contract
export const OrderResultStructure = {
    encryptedResult: String,
    encryptedError: String, // TODO Remove
    orderPrice: String,
};
export type OrderResult = {
    encryptedResult: string;
    encryptedError: string; // TODO Remove
    orderPrice: string;
};

export type SubOrderParams = {
    blockParentOrder: Boolean;
    externalId: string;
    holdSum: string;
}
