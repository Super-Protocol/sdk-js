export type OfferCreatedEvent = {
    creator: string;
    externalId: string;
    offerId: number;
};

export type OrderCreatedEvent = {
    consumer: string;
    externalId: string;
    offerId: number;
    orderId: number;
};

export type SubOrderCreatedEvent = {
    consumer: string;
    externalId: string;
    subOfferId: number;
    subOrderId: number;
    parentOrderId: number;
};
