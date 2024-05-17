/* eslint-disable prettier/prettier */
import { CryptoAlgorithm } from '@super-protocol/dto-js';

export type AsymmetricKeys = {
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
};

export type SymmetricKey = Buffer;

export type CryptoKeyType<T extends CryptoAlgorithm> =
    T extends CryptoAlgorithm.ECIES ? AsymmetricKeys :
    T extends CryptoAlgorithm.AES ? SymmetricKey :
    never;
