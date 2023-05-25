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

export type TeeSlotAddedEvent = {
    creator: string;
    offerId: string;
    slotId: string;
    externalId: string;
};

export type ValueSlotAddedEvent = {
    creator: string;
    offerId: string;
    slotId: string;
    externalId: string;
};
