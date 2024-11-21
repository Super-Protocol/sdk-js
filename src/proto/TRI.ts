/* eslint-disable */
import _m0 from "protobufjs/minimal.js";

export const protobufPackage = "";

export interface Encryption {
  algo: string;
  key?: Uint8Array | undefined;
  cipher?: string | undefined;
  ciphertext?: Uint8Array | undefined;
  iv?: Uint8Array | undefined;
  mac?: Uint8Array | undefined;
  encoding: string;
}

export interface Hash {
  algo: string;
  hash: Uint8Array;
}

export interface TRI {
  solutionHashes: Hash[];
  mrenclave: Uint8Array;
  args: string;
  encryption: Encryption | undefined;
  mrsigner: Uint8Array;
  imageHashes: Hash[];
}

function createBaseEncryption(): Encryption {
  return {
    algo: "",
    key: undefined,
    cipher: undefined,
    ciphertext: undefined,
    iv: undefined,
    mac: undefined,
    encoding: "",
  };
}

export const Encryption = {
  encode(message: Encryption, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.algo !== "") {
      writer.uint32(10).string(message.algo);
    }
    if (message.key !== undefined) {
      writer.uint32(18).bytes(message.key);
    }
    if (message.cipher !== undefined) {
      writer.uint32(26).string(message.cipher);
    }
    if (message.ciphertext !== undefined) {
      writer.uint32(34).bytes(message.ciphertext);
    }
    if (message.iv !== undefined) {
      writer.uint32(50).bytes(message.iv);
    }
    if (message.mac !== undefined) {
      writer.uint32(58).bytes(message.mac);
    }
    if (message.encoding !== "") {
      writer.uint32(66).string(message.encoding);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Encryption {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEncryption();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.algo = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.key = reader.bytes();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.cipher = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.ciphertext = reader.bytes();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.iv = reader.bytes();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.mac = reader.bytes();
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.encoding = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Encryption {
    return {
      algo: isSet(object.algo) ? globalThis.String(object.algo) : "",
      key: isSet(object.key) ? bytesFromBase64(object.key) : undefined,
      cipher: isSet(object.cipher) ? globalThis.String(object.cipher) : undefined,
      ciphertext: isSet(object.ciphertext) ? bytesFromBase64(object.ciphertext) : undefined,
      iv: isSet(object.iv) ? bytesFromBase64(object.iv) : undefined,
      mac: isSet(object.mac) ? bytesFromBase64(object.mac) : undefined,
      encoding: isSet(object.encoding) ? globalThis.String(object.encoding) : "",
    };
  },

  toJSON(message: Encryption): unknown {
    const obj: any = {};
    if (message.algo !== "") {
      obj.algo = message.algo;
    }
    if (message.key !== undefined) {
      obj.key = base64FromBytes(message.key);
    }
    if (message.cipher !== undefined) {
      obj.cipher = message.cipher;
    }
    if (message.ciphertext !== undefined) {
      obj.ciphertext = base64FromBytes(message.ciphertext);
    }
    if (message.iv !== undefined) {
      obj.iv = base64FromBytes(message.iv);
    }
    if (message.mac !== undefined) {
      obj.mac = base64FromBytes(message.mac);
    }
    if (message.encoding !== "") {
      obj.encoding = message.encoding;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Encryption>, I>>(base?: I): Encryption {
    return Encryption.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Encryption>, I>>(object: I): Encryption {
    const message = createBaseEncryption();
    message.algo = object.algo ?? "";
    message.key = object.key ?? undefined;
    message.cipher = object.cipher ?? undefined;
    message.ciphertext = object.ciphertext ?? undefined;
    message.iv = object.iv ?? undefined;
    message.mac = object.mac ?? undefined;
    message.encoding = object.encoding ?? "";
    return message;
  },
};

function createBaseHash(): Hash {
  return { algo: "", hash: new Uint8Array(0) };
}

export const Hash = {
  encode(message: Hash, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.algo !== "") {
      writer.uint32(10).string(message.algo);
    }
    if (message.hash.length !== 0) {
      writer.uint32(18).bytes(message.hash);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Hash {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseHash();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.algo = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.hash = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Hash {
    return {
      algo: isSet(object.algo) ? globalThis.String(object.algo) : "",
      hash: isSet(object.hash) ? bytesFromBase64(object.hash) : new Uint8Array(0),
    };
  },

  toJSON(message: Hash): unknown {
    const obj: any = {};
    if (message.algo !== "") {
      obj.algo = message.algo;
    }
    if (message.hash.length !== 0) {
      obj.hash = base64FromBytes(message.hash);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Hash>, I>>(base?: I): Hash {
    return Hash.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Hash>, I>>(object: I): Hash {
    const message = createBaseHash();
    message.algo = object.algo ?? "";
    message.hash = object.hash ?? new Uint8Array(0);
    return message;
  },
};

function createBaseTRI(): TRI {
  return {
    solutionHashes: [],
    mrenclave: new Uint8Array(0),
    args: "",
    encryption: undefined,
    mrsigner: new Uint8Array(0),
    imageHashes: [],
  };
}

export const TRI = {
  encode(message: TRI, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.solutionHashes) {
      Hash.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.mrenclave.length !== 0) {
      writer.uint32(18).bytes(message.mrenclave);
    }
    if (message.args !== "") {
      writer.uint32(26).string(message.args);
    }
    if (message.encryption !== undefined) {
      Encryption.encode(message.encryption, writer.uint32(34).fork()).ldelim();
    }
    if (message.mrsigner.length !== 0) {
      writer.uint32(42).bytes(message.mrsigner);
    }
    for (const v of message.imageHashes) {
      Hash.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TRI {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTRI();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.solutionHashes.push(Hash.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.mrenclave = reader.bytes();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.args = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.encryption = Encryption.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.mrsigner = reader.bytes();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.imageHashes.push(Hash.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TRI {
    return {
      solutionHashes: globalThis.Array.isArray(object?.solutionHashes)
        ? object.solutionHashes.map((e: any) => Hash.fromJSON(e))
        : [],
      mrenclave: isSet(object.mrenclave) ? bytesFromBase64(object.mrenclave) : new Uint8Array(0),
      args: isSet(object.args) ? globalThis.String(object.args) : "",
      encryption: isSet(object.encryption) ? Encryption.fromJSON(object.encryption) : undefined,
      mrsigner: isSet(object.mrsigner) ? bytesFromBase64(object.mrsigner) : new Uint8Array(0),
      imageHashes: globalThis.Array.isArray(object?.imageHashes)
        ? object.imageHashes.map((e: any) => Hash.fromJSON(e))
        : [],
    };
  },

  toJSON(message: TRI): unknown {
    const obj: any = {};
    if (message.solutionHashes?.length) {
      obj.solutionHashes = message.solutionHashes.map((e) => Hash.toJSON(e));
    }
    if (message.mrenclave.length !== 0) {
      obj.mrenclave = base64FromBytes(message.mrenclave);
    }
    if (message.args !== "") {
      obj.args = message.args;
    }
    if (message.encryption !== undefined) {
      obj.encryption = Encryption.toJSON(message.encryption);
    }
    if (message.mrsigner.length !== 0) {
      obj.mrsigner = base64FromBytes(message.mrsigner);
    }
    if (message.imageHashes?.length) {
      obj.imageHashes = message.imageHashes.map((e) => Hash.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<TRI>, I>>(base?: I): TRI {
    return TRI.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<TRI>, I>>(object: I): TRI {
    const message = createBaseTRI();
    message.solutionHashes = object.solutionHashes?.map((e) => Hash.fromPartial(e)) || [];
    message.mrenclave = object.mrenclave ?? new Uint8Array(0);
    message.args = object.args ?? "";
    message.encryption = (object.encryption !== undefined && object.encryption !== null)
      ? Encryption.fromPartial(object.encryption)
      : undefined;
    message.mrsigner = object.mrsigner ?? new Uint8Array(0);
    message.imageHashes = object.imageHashes?.map((e) => Hash.fromPartial(e)) || [];
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
