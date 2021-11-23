// Order of keys for this object in blockchain contract
export const ProviderInfoArguments = ["tokenReceiver", "actionAccount", "name", "description", "metadata"];
export type ProviderInfo = {
    tokenReceiver: string;
    actionAccount: string;
    name: string;
    description: string;
    metadata: string;
};
