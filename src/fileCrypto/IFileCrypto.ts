import {
    Encryption,
    CryptoAlgorithm,
    Encoding,
} from "@super-protocol/sp-dto-js";

export default interface IFileCrypto {
    encrypt(
        inputFilepath: string,
        outputFilepath: string,
        algorithm: CryptoAlgorithm,
        encoding: Encoding,
        encryptionKey: string,
        progressListener?: (total: number, current: number) => void
    ): Promise<Encryption>;

    decrypt(
        inputFilepath: string,
        outputFilepath: string,
        encryptionInfo: Encryption,
        progressListener?: (total: number, current: number) => void
    ): Promise<void>;
}