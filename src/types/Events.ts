export type OfferCreatedEvent = {
    creator: string;
    externalId: string;
    offerId: string;
};

export type OrderCreatedEvent = {
    consumer: string;
    externalId: string;
    offerId: string;
    parentOrderId: string;
    orderId: string;
};
