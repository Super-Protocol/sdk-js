import BlockchainConnector from "./BlockchainConnector";
import IFileCrypto from "./fileCrypto/IFileCrypto";
import { isNodeJS } from "./utils";

export default BlockchainConnector;
export * from "./BlockchainConnector";

export { default as Crypto } from "./Crypto";
export * from "./Crypto";

export * from "./fileCrypto/IFileCrypto";

// Example of a constructor type definition: https://github.com/angular/angular/blob/6.1.6/packages/core/src/type.ts#L25
export const FileCrypto: new () => IFileCrypto = isNodeJS()
    ? require("./fileCrypto/NodeJSFileCrypto")
    : null;

export { default as TIIGenerator } from "./TIIGenerator";
export * from "./TIIGenerator";

export { default as Consensus } from "./staticModels/Consensus";
export * from "./staticModels/Consensus";

export { default as LastBlocks } from "./staticModels/LastBlocks";
export * from "./staticModels/LastBlocks";

export { default as Suspicious } from "./staticModels/Suspicious";
export * from "./staticModels/Suspicious";

export { default as OrdersFactory } from "./staticModels/OrdersFactory";
export * from "./staticModels/OrdersFactory";

export { default as OffersFactory } from "./staticModels/OffersFactory";
export * from "./staticModels/OffersFactory";

export { default as TeeOffersFactory } from "./staticModels/TeeOffersFactory";
export * from "./staticModels/TeeOffersFactory";

export { default as ProviderRegistry } from "./staticModels/ProviderRegistry";
export * from "./staticModels/ProviderRegistry";

export { default as Staking } from "./staticModels/Staking";
export * from "./staticModels/Staking";

export { default as Voting } from "./staticModels/Voting";
export * from "./staticModels/Voting";

export { default as SuperproToken } from "./staticModels/SuperproToken";
export * from "./staticModels/SuperproToken";

export { default as Superpro } from "./staticModels/Superpro";
export * from "./staticModels/Superpro";

export { default as Order } from "./models/Order";
export * from "./models/Order";

export { default as Provider } from "./models/Provider";
export * from "./models/Provider";

export { default as TeeOffer } from "./models/TeeOffer";
export * from "./models/TeeOffer";

export { default as Offer } from "./models/Offer";
export * from "./models/Offer";

export { default as Ballot } from "./models/Ballot";
export * from "./models/Ballot";

export { default as TCB } from "./models/TCB";
export * from "./models/TCB";

export * from "./types/Offer";
export * from "./types/Order";
export * from "./types/TeeOffer";
export * from "./types/Provider";
export * from "./types/Staking";
export * from "./types/Ballot";
export * from "./types/Superpro";
export * from "./types/TcbData";

export { default as StorageFileAccess } from "./types/storage/StorageFileAccess";
export { default as StorageObject } from "./types/storage/StorageObject";
export { default as StorageAccess } from "./types/storage/StorageAccess";

export { default as getStorageProvider } from "./providers/storage/getStorageProvider";
export { default as IStorageProvider } from "./providers/storage/IStorageProvider";
