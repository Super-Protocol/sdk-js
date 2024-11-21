import { decode, encode } from '@msgpack/msgpack';
import { TcbVerifiedStatus } from '@super-protocol/dto-js';
import { BlockchainId } from '../types/index.js';

export type TcbData = {
  checkingTcbId: string;
  pubKey: string;
  checkingTcbIds: BlockchainId[];
  checkingTcbMarks: TcbVerifiedStatus[];
  deviceId: string;
  benchmark: number;
  properties: string;
};

export type VersionedTcbData = {
  v: number;
  [key: string]: unknown;
};

export class TcbDataSerializer {
  private static readonly VERSION = 1; // Current version of the data structure

  static serialize(data: TcbData): Uint8Array {
    const serializedData: VersionedTcbData = {
      v: TcbDataSerializer.VERSION,
      quote: data,
    };

    return encode(serializedData, { sortKeys: true });
  }

  static deserialize(buffer: Uint8Array): TcbData {
    const { v, ...rest } = decode(buffer) as VersionedTcbData;

    switch (v) {
      case 1: {
        return rest as TcbData;
      }
      // Future versions can be handled here with additional cases
      default:
        throw new Error(`Unsupported version: ${v}`);
    }
  }
}
