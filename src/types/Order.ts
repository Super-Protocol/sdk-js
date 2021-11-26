export enum OrderStatus {
    New = "0",
    Processing = "1",
    Canceling = "2",
    Canceled = "3",
    Done = "4",
    Error = "5",
    AwaitingPayment = "6", // FIXME: there is no status AwaitingPayment in blockchain yet
}

export const OrderArgsArguments = ["slots", "inputOffers", "selectedOffers"];
export type OrderArgs = {
    slots: number;
    inputOffers: string[];
    selectedOffers: string[];
};

// Order of keys for this object in blockchain contract
export const OrderInfoArguments = [
    "offer",
    "resultPublicKey",
    "resultPublicKeyAlgo",
    "encryptedRequirements",
    "encryptedArgs",
    "status",
    "args",
];
export type OrderInfo = {
    offer: string;
    resultPublicKey: string;
    resultPublicKeyAlgo: string;
    encryptedRequirements: string;
    encryptedArgs: string;
    status: OrderStatus;
    args: OrderArgs;
};

// Order of keys for this object in blockchain contract
export const OrderResultArguments = ["encryptedResult", "encryptedError", "orderPrice"];
export type OrderResult = {
    encryptedResult: string;
    encryptedError: string;
    orderPrice: number;
};
