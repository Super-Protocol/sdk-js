export type OfferCreatedEvent = {
    creator: string;
    externalId: string;
    offerId: string;
};

export type OrderCreatedEvent = {
    consumer: string;
    externalId: string;
    offerId: string;
    orderId: string;
};

export type SubOrderCreatedEvent = {
    consumer: string;
    externalId: string;
    subOfferId: string;
    subOrderId: string;
    parentOrderId: string;
};
