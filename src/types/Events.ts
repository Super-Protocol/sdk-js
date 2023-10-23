export type OfferCreatedEvent = {
    creator: string;
    externalId: string;
    offerId: bigint;
};

export type OrderCreatedEvent = {
    consumer: string;
    externalId: string;
    offerId: bigint;
    parentOrderId: bigint;
    orderId: bigint;
};

export type TeeSlotAddedEvent = {
    creator: string;
    offerId: bigint;
    slotId: bigint;
    externalId: string;
};

export type ValueSlotAddedEvent = {
    creator: string;
    offerId: bigint;
    slotId: bigint;
    externalId: string;
};

export type OptionAddedEvent = {
    creator: string;
    teeOfferId: bigint;
    optionId: bigint;
    externalId: string;
};
