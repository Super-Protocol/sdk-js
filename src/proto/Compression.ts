/* eslint-disable */
import _m0 from "protobufjs/minimal.js";

export const protobufPackage = "";

export interface Compression {
  type: Compression_TYPE;
  data: Uint8Array;
}

export enum Compression_TYPE {
  Uncompressed = 0,
  GZIP = 1,
}

export function compression_TYPEFromJSON(object: any): Compression_TYPE {
  switch (object) {
    case 0:
    case "Uncompressed":
      return Compression_TYPE.Uncompressed;
    case 1:
    case "GZIP":
      return Compression_TYPE.GZIP;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum Compression_TYPE");
  }
}

export function compression_TYPEToJSON(object: Compression_TYPE): string {
  switch (object) {
    case Compression_TYPE.Uncompressed:
      return "Uncompressed";
    case Compression_TYPE.GZIP:
      return "GZIP";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum Compression_TYPE");
  }
}

function createBaseCompression(): Compression {
  return { type: 0, data: new Uint8Array(0) };
}

export const Compression = {
  encode(message: Compression, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== 0) {
      writer.uint32(8).int32(message.type);
    }
    if (message.data.length !== 0) {
      writer.uint32(18).bytes(message.data);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Compression {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCompression();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.type = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.data = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Compression {
    return {
      type: isSet(object.type) ? compression_TYPEFromJSON(object.type) : 0,
      data: isSet(object.data) ? bytesFromBase64(object.data) : new Uint8Array(0),
    };
  },

  toJSON(message: Compression): unknown {
    const obj: any = {};
    if (message.type !== 0) {
      obj.type = compression_TYPEToJSON(message.type);
    }
    if (message.data.length !== 0) {
      obj.data = base64FromBytes(message.data);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Compression>, I>>(base?: I): Compression {
    return Compression.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Compression>, I>>(object: I): Compression {
    const message = createBaseCompression();
    message.type = object.type ?? 0;
    message.data = object.data ?? new Uint8Array(0);
    return message;
  },
};

function bytesFromBase64(b64: string): Uint8Array {
  if ((globalThis as any).Buffer) {
    return Uint8Array.from(globalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = globalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if ((globalThis as any).Buffer) {
    return globalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(globalThis.String.fromCharCode(byte));
    });
    return globalThis.btoa(bin.join(""));
  }
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
