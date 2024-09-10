/* eslint-disable prettier/prettier */
import { CryptoAlgorithm } from '@super-protocol/dto-js';
import { KeyObject } from 'crypto';

export type AsymmetricKeys = {
  publicKey: KeyObject;
  privateKey: KeyObject;
};

export type SymmetricKey = Buffer;

export type CryptoKeyType<T extends CryptoAlgorithm> =
    T extends CryptoAlgorithm.ECIES ? AsymmetricKeys :
    T extends CryptoAlgorithm.AES ? SymmetricKey :
    never;
