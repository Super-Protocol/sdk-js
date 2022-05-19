/* eslint-disable */
import Long from "long";
import * as _m0 from "protobufjs/minimal";

export const protobufPackage = "";

export interface Encryption {
    algo: string;
    key: Uint8Array;
    cipher: string;
    ciphertext: Uint8Array;
    iv: Uint8Array;
    mac: Uint8Array;
}

export interface Hash {
    type: string;
    hash: Uint8Array;
}

export interface TRI {
    solutionHashes: Hash[];
    mrenclave: Uint8Array;
    args: string;
    encryption: Encryption | undefined;
}

function createBaseEncryption(): Encryption {
    return {
        algo: "",
        key: new Uint8Array(),
        cipher: "",
        ciphertext: new Uint8Array(),
        iv: new Uint8Array(),
        mac: new Uint8Array(),
    };
}

export const Encryption = {
    encode(message: Encryption, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
        if (message.algo !== "") {
            writer.uint32(10).string(message.algo);
        }
        if (message.key.length !== 0) {
            writer.uint32(18).bytes(message.key);
        }
        if (message.cipher !== "") {
            writer.uint32(26).string(message.cipher);
        }
        if (message.ciphertext.length !== 0) {
            writer.uint32(34).bytes(message.ciphertext);
        }
        if (message.iv.length !== 0) {
            writer.uint32(50).bytes(message.iv);
        }
        if (message.mac.length !== 0) {
            writer.uint32(58).bytes(message.mac);
        }
        return writer;
    },

    decode(input: _m0.Reader | Uint8Array, length?: number): Encryption {
        const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseEncryption();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.algo = reader.string();
                    break;
                case 2:
                    message.key = reader.bytes();
                    break;
                case 3:
                    message.cipher = reader.string();
                    break;
                case 4:
                    message.ciphertext = reader.bytes();
                    break;
                case 6:
                    message.iv = reader.bytes();
                    break;
                case 7:
                    message.mac = reader.bytes();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): Encryption {
        return {
            algo: isSet(object.algo) ? String(object.algo) : "",
            key: isSet(object.key) ? bytesFromBase64(object.key) : new Uint8Array(),
            cipher: isSet(object.cipher) ? String(object.cipher) : "",
            ciphertext: isSet(object.ciphertext) ? bytesFromBase64(object.ciphertext) : new Uint8Array(),
            iv: isSet(object.iv) ? bytesFromBase64(object.iv) : new Uint8Array(),
            mac: isSet(object.mac) ? bytesFromBase64(object.mac) : new Uint8Array(),
        };
    },

    toJSON(message: Encryption): unknown {
        const obj: any = {};
        message.algo !== undefined && (obj.algo = message.algo);
        message.key !== undefined &&
            (obj.key = base64FromBytes(message.key !== undefined ? message.key : new Uint8Array()));
        message.cipher !== undefined && (obj.cipher = message.cipher);
        message.ciphertext !== undefined &&
            (obj.ciphertext = base64FromBytes(
                message.ciphertext !== undefined ? message.ciphertext : new Uint8Array(),
            ));
        message.iv !== undefined &&
            (obj.iv = base64FromBytes(message.iv !== undefined ? message.iv : new Uint8Array()));
        message.mac !== undefined &&
            (obj.mac = base64FromBytes(message.mac !== undefined ? message.mac : new Uint8Array()));
        return obj;
    },

    fromPartial<I extends Exact<DeepPartial<Encryption>, I>>(object: I): Encryption {
        const message = createBaseEncryption();
        message.algo = object.algo ?? "";
        message.key = object.key ?? new Uint8Array();
        message.cipher = object.cipher ?? "";
        message.ciphertext = object.ciphertext ?? new Uint8Array();
        message.iv = object.iv ?? new Uint8Array();
        message.mac = object.mac ?? new Uint8Array();
        return message;
    },
};

function createBaseHash(): Hash {
    return { type: "", hash: new Uint8Array() };
}

export const Hash = {
    encode(message: Hash, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
        if (message.type !== "") {
            writer.uint32(10).string(message.type);
        }
        if (message.hash.length !== 0) {
            writer.uint32(18).bytes(message.hash);
        }
        return writer;
    },

    decode(input: _m0.Reader | Uint8Array, length?: number): Hash {
        const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseHash();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.type = reader.string();
                    break;
                case 2:
                    message.hash = reader.bytes();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): Hash {
        return {
            type: isSet(object.type) ? String(object.type) : "",
            hash: isSet(object.hash) ? bytesFromBase64(object.hash) : new Uint8Array(),
        };
    },

    toJSON(message: Hash): unknown {
        const obj: any = {};
        message.type !== undefined && (obj.type = message.type);
        message.hash !== undefined &&
            (obj.hash = base64FromBytes(message.hash !== undefined ? message.hash : new Uint8Array()));
        return obj;
    },

    fromPartial<I extends Exact<DeepPartial<Hash>, I>>(object: I): Hash {
        const message = createBaseHash();
        message.type = object.type ?? "";
        message.hash = object.hash ?? new Uint8Array();
        return message;
    },
};

function createBaseTRI(): TRI {
    return { solutionHashes: [], mrenclave: new Uint8Array(), args: "", encryption: undefined };
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
        return writer;
    },

    decode(input: _m0.Reader | Uint8Array, length?: number): TRI {
        const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseTRI();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.solutionHashes.push(Hash.decode(reader, reader.uint32()));
                    break;
                case 2:
                    message.mrenclave = reader.bytes();
                    break;
                case 3:
                    message.args = reader.string();
                    break;
                case 4:
                    message.encryption = Encryption.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): TRI {
        return {
            solutionHashes: Array.isArray(object?.solutionHashes)
                ? object.solutionHashes.map((e: any) => Hash.fromJSON(e))
                : [],
            mrenclave: isSet(object.mrenclave) ? bytesFromBase64(object.mrenclave) : new Uint8Array(),
            args: isSet(object.args) ? String(object.args) : "",
            encryption: isSet(object.encryption) ? Encryption.fromJSON(object.encryption) : undefined,
        };
    },

    toJSON(message: TRI): unknown {
        const obj: any = {};
        if (message.solutionHashes) {
            obj.solutionHashes = message.solutionHashes.map((e) => (e ? Hash.toJSON(e) : undefined));
        } else {
            obj.solutionHashes = [];
        }
        message.mrenclave !== undefined &&
            (obj.mrenclave = base64FromBytes(message.mrenclave !== undefined ? message.mrenclave : new Uint8Array()));
        message.args !== undefined && (obj.args = message.args);
        message.encryption !== undefined &&
            (obj.encryption = message.encryption ? Encryption.toJSON(message.encryption) : undefined);
        return obj;
    },

    fromPartial<I extends Exact<DeepPartial<TRI>, I>>(object: I): TRI {
        const message = createBaseTRI();
        message.solutionHashes = object.solutionHashes?.map((e) => Hash.fromPartial(e)) || [];
        message.mrenclave = object.mrenclave ?? new Uint8Array();
        message.args = object.args ?? "";
        message.encryption =
            object.encryption !== undefined && object.encryption !== null
                ? Encryption.fromPartial(object.encryption)
                : undefined;
        return message;
    },
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var globalThis: any = (() => {
    if (typeof globalThis !== "undefined") return globalThis;
    if (typeof self !== "undefined") return self;
    if (typeof window !== "undefined") return window;
    if (typeof global !== "undefined") return global;
    throw "Unable to locate global object";
})();

const atob: (b64: string) => string =
    globalThis.atob || ((b64) => globalThis.Buffer.from(b64, "base64").toString("binary"));
function bytesFromBase64(b64: string): Uint8Array {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
        arr[i] = bin.charCodeAt(i);
    }
    return arr;
}

const btoa: (bin: string) => string =
    globalThis.btoa || ((bin) => globalThis.Buffer.from(bin, "binary").toString("base64"));
function base64FromBytes(arr: Uint8Array): string {
    const bin: string[] = [];
    arr.forEach((byte) => {
        bin.push(String.fromCharCode(byte));
    });
    return btoa(bin.join(""));
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin
    ? T
    : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : T extends {}
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin
    ? P
    : P & { [K in keyof P]: Exact<P[K], I[K]> } & Record<Exclude<keyof I, KeysOfUnion<P>>, never>;

if (_m0.util.Long !== Long) {
    _m0.util.Long = Long as any;
    _m0.configure();
}

function isSet(value: any): boolean {
    return value !== null && value !== undefined;
}
