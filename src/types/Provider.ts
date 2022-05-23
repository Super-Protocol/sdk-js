// Order of keys and type conversion functions for this object in blockchain contract
export const ProviderInfoStructure = {
    tokenReceiver: String,
    actionAccount: String,
    name: String,
    description: String,
    metadata: String,
};
export const ProviderInfoStructureV2 = {
    tokenReceiver: String,
    actionAccount: String,
    name: String,
    description: String,
    metadata: String,
    externalId: String
};
export type ProviderInfo = {
    tokenReceiver: string;
    actionAccount: string;
    name: string;
    description: string;
    metadata: string;
};

export type ProviderInfoV2 = ProviderInfo & {
    externalId?: string;
};
