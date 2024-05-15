/* eslint-disable */
import _m0 from "protobufjs/minimal.js";

export const protobufPackage = "";

export interface TeeProperties {
  teeDeviceInfo: TeeDeviceInfo | undefined;
  teeRunCpuBenchmark: TeeRunCpuBenchmark | undefined;
  teeRunMemoryBenchmark: TeeRunMemoryBenchmark | undefined;
}

export interface TeeDeviceInfo {
  cpus: Cpus[];
  memSize: number;
  totalPhysicalCores: number;
  totalLogicalCores: number;
}

export interface Cpus {
  vendorId: string;
  cpuFamily: number;
  model: number;
  modelName: string;
  physicalCores: number;
  logicalCores: number;
  baseFreq: number;
  maxFreq: number;
}

export interface TeeRunCpuBenchmark {
  cpuScore: number;
  cpuBenchmark: string;
  cpuCoresCount: number;
}

export interface TeeRunMemoryBenchmark {
  memBandwidth: number;
  memConfirmedSize: number;
}

function createBaseTeeProperties(): TeeProperties {
  return { teeDeviceInfo: undefined, teeRunCpuBenchmark: undefined, teeRunMemoryBenchmark: undefined };
}

export const TeeProperties = {
  encode(message: TeeProperties, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.teeDeviceInfo !== undefined) {
      TeeDeviceInfo.encode(message.teeDeviceInfo, writer.uint32(10).fork()).ldelim();
    }
    if (message.teeRunCpuBenchmark !== undefined) {
      TeeRunCpuBenchmark.encode(message.teeRunCpuBenchmark, writer.uint32(18).fork()).ldelim();
    }
    if (message.teeRunMemoryBenchmark !== undefined) {
      TeeRunMemoryBenchmark.encode(message.teeRunMemoryBenchmark, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TeeProperties {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTeeProperties();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.teeDeviceInfo = TeeDeviceInfo.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.teeRunCpuBenchmark = TeeRunCpuBenchmark.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.teeRunMemoryBenchmark = TeeRunMemoryBenchmark.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TeeProperties {
    return {
      teeDeviceInfo: isSet(object.teeDeviceInfo) ? TeeDeviceInfo.fromJSON(object.teeDeviceInfo) : undefined,
      teeRunCpuBenchmark: isSet(object.teeRunCpuBenchmark)
        ? TeeRunCpuBenchmark.fromJSON(object.teeRunCpuBenchmark)
        : undefined,
      teeRunMemoryBenchmark: isSet(object.teeRunMemoryBenchmark)
        ? TeeRunMemoryBenchmark.fromJSON(object.teeRunMemoryBenchmark)
        : undefined,
    };
  },

  toJSON(message: TeeProperties): unknown {
    const obj: any = {};
    if (message.teeDeviceInfo !== undefined) {
      obj.teeDeviceInfo = TeeDeviceInfo.toJSON(message.teeDeviceInfo);
    }
    if (message.teeRunCpuBenchmark !== undefined) {
      obj.teeRunCpuBenchmark = TeeRunCpuBenchmark.toJSON(message.teeRunCpuBenchmark);
    }
    if (message.teeRunMemoryBenchmark !== undefined) {
      obj.teeRunMemoryBenchmark = TeeRunMemoryBenchmark.toJSON(message.teeRunMemoryBenchmark);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<TeeProperties>, I>>(base?: I): TeeProperties {
    return TeeProperties.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<TeeProperties>, I>>(object: I): TeeProperties {
    const message = createBaseTeeProperties();
    message.teeDeviceInfo = (object.teeDeviceInfo !== undefined && object.teeDeviceInfo !== null)
      ? TeeDeviceInfo.fromPartial(object.teeDeviceInfo)
      : undefined;
    message.teeRunCpuBenchmark = (object.teeRunCpuBenchmark !== undefined && object.teeRunCpuBenchmark !== null)
      ? TeeRunCpuBenchmark.fromPartial(object.teeRunCpuBenchmark)
      : undefined;
    message.teeRunMemoryBenchmark =
      (object.teeRunMemoryBenchmark !== undefined && object.teeRunMemoryBenchmark !== null)
        ? TeeRunMemoryBenchmark.fromPartial(object.teeRunMemoryBenchmark)
        : undefined;
    return message;
  },
};

function createBaseTeeDeviceInfo(): TeeDeviceInfo {
  return { cpus: [], memSize: 0, totalPhysicalCores: 0, totalLogicalCores: 0 };
}

export const TeeDeviceInfo = {
  encode(message: TeeDeviceInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.cpus) {
      Cpus.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.memSize !== 0) {
      writer.uint32(16).int32(message.memSize);
    }
    if (message.totalPhysicalCores !== 0) {
      writer.uint32(24).int32(message.totalPhysicalCores);
    }
    if (message.totalLogicalCores !== 0) {
      writer.uint32(32).int32(message.totalLogicalCores);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TeeDeviceInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTeeDeviceInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.cpus.push(Cpus.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.memSize = reader.int32();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.totalPhysicalCores = reader.int32();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.totalLogicalCores = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TeeDeviceInfo {
    return {
      cpus: globalThis.Array.isArray(object?.cpus) ? object.cpus.map((e: any) => Cpus.fromJSON(e)) : [],
      memSize: isSet(object.memSize) ? globalThis.Number(object.memSize) : 0,
      totalPhysicalCores: isSet(object.totalPhysicalCores) ? globalThis.Number(object.totalPhysicalCores) : 0,
      totalLogicalCores: isSet(object.totalLogicalCores) ? globalThis.Number(object.totalLogicalCores) : 0,
    };
  },

  toJSON(message: TeeDeviceInfo): unknown {
    const obj: any = {};
    if (message.cpus?.length) {
      obj.cpus = message.cpus.map((e) => Cpus.toJSON(e));
    }
    if (message.memSize !== 0) {
      obj.memSize = Math.round(message.memSize);
    }
    if (message.totalPhysicalCores !== 0) {
      obj.totalPhysicalCores = Math.round(message.totalPhysicalCores);
    }
    if (message.totalLogicalCores !== 0) {
      obj.totalLogicalCores = Math.round(message.totalLogicalCores);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<TeeDeviceInfo>, I>>(base?: I): TeeDeviceInfo {
    return TeeDeviceInfo.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<TeeDeviceInfo>, I>>(object: I): TeeDeviceInfo {
    const message = createBaseTeeDeviceInfo();
    message.cpus = object.cpus?.map((e) => Cpus.fromPartial(e)) || [];
    message.memSize = object.memSize ?? 0;
    message.totalPhysicalCores = object.totalPhysicalCores ?? 0;
    message.totalLogicalCores = object.totalLogicalCores ?? 0;
    return message;
  },
};

function createBaseCpus(): Cpus {
  return {
    vendorId: "",
    cpuFamily: 0,
    model: 0,
    modelName: "",
    physicalCores: 0,
    logicalCores: 0,
    baseFreq: 0,
    maxFreq: 0,
  };
}

export const Cpus = {
  encode(message: Cpus, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.vendorId !== "") {
      writer.uint32(10).string(message.vendorId);
    }
    if (message.cpuFamily !== 0) {
      writer.uint32(16).int32(message.cpuFamily);
    }
    if (message.model !== 0) {
      writer.uint32(24).int32(message.model);
    }
    if (message.modelName !== "") {
      writer.uint32(34).string(message.modelName);
    }
    if (message.physicalCores !== 0) {
      writer.uint32(40).int32(message.physicalCores);
    }
    if (message.logicalCores !== 0) {
      writer.uint32(48).int32(message.logicalCores);
    }
    if (message.baseFreq !== 0) {
      writer.uint32(56).int32(message.baseFreq);
    }
    if (message.maxFreq !== 0) {
      writer.uint32(64).int32(message.maxFreq);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Cpus {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCpus();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.vendorId = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.cpuFamily = reader.int32();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.model = reader.int32();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.modelName = reader.string();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.physicalCores = reader.int32();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.logicalCores = reader.int32();
          continue;
        case 7:
          if (tag !== 56) {
            break;
          }

          message.baseFreq = reader.int32();
          continue;
        case 8:
          if (tag !== 64) {
            break;
          }

          message.maxFreq = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Cpus {
    return {
      vendorId: isSet(object.vendorId) ? globalThis.String(object.vendorId) : "",
      cpuFamily: isSet(object.cpuFamily) ? globalThis.Number(object.cpuFamily) : 0,
      model: isSet(object.model) ? globalThis.Number(object.model) : 0,
      modelName: isSet(object.modelName) ? globalThis.String(object.modelName) : "",
      physicalCores: isSet(object.physicalCores) ? globalThis.Number(object.physicalCores) : 0,
      logicalCores: isSet(object.logicalCores) ? globalThis.Number(object.logicalCores) : 0,
      baseFreq: isSet(object.baseFreq) ? globalThis.Number(object.baseFreq) : 0,
      maxFreq: isSet(object.maxFreq) ? globalThis.Number(object.maxFreq) : 0,
    };
  },

  toJSON(message: Cpus): unknown {
    const obj: any = {};
    if (message.vendorId !== "") {
      obj.vendorId = message.vendorId;
    }
    if (message.cpuFamily !== 0) {
      obj.cpuFamily = Math.round(message.cpuFamily);
    }
    if (message.model !== 0) {
      obj.model = Math.round(message.model);
    }
    if (message.modelName !== "") {
      obj.modelName = message.modelName;
    }
    if (message.physicalCores !== 0) {
      obj.physicalCores = Math.round(message.physicalCores);
    }
    if (message.logicalCores !== 0) {
      obj.logicalCores = Math.round(message.logicalCores);
    }
    if (message.baseFreq !== 0) {
      obj.baseFreq = Math.round(message.baseFreq);
    }
    if (message.maxFreq !== 0) {
      obj.maxFreq = Math.round(message.maxFreq);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Cpus>, I>>(base?: I): Cpus {
    return Cpus.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Cpus>, I>>(object: I): Cpus {
    const message = createBaseCpus();
    message.vendorId = object.vendorId ?? "";
    message.cpuFamily = object.cpuFamily ?? 0;
    message.model = object.model ?? 0;
    message.modelName = object.modelName ?? "";
    message.physicalCores = object.physicalCores ?? 0;
    message.logicalCores = object.logicalCores ?? 0;
    message.baseFreq = object.baseFreq ?? 0;
    message.maxFreq = object.maxFreq ?? 0;
    return message;
  },
};

function createBaseTeeRunCpuBenchmark(): TeeRunCpuBenchmark {
  return { cpuScore: 0, cpuBenchmark: "", cpuCoresCount: 0 };
}

export const TeeRunCpuBenchmark = {
  encode(message: TeeRunCpuBenchmark, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.cpuScore !== 0) {
      writer.uint32(8).int32(message.cpuScore);
    }
    if (message.cpuBenchmark !== "") {
      writer.uint32(18).string(message.cpuBenchmark);
    }
    if (message.cpuCoresCount !== 0) {
      writer.uint32(24).int32(message.cpuCoresCount);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TeeRunCpuBenchmark {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTeeRunCpuBenchmark();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.cpuScore = reader.int32();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.cpuBenchmark = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.cpuCoresCount = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TeeRunCpuBenchmark {
    return {
      cpuScore: isSet(object.cpuScore) ? globalThis.Number(object.cpuScore) : 0,
      cpuBenchmark: isSet(object.cpuBenchmark) ? globalThis.String(object.cpuBenchmark) : "",
      cpuCoresCount: isSet(object.cpuCoresCount) ? globalThis.Number(object.cpuCoresCount) : 0,
    };
  },

  toJSON(message: TeeRunCpuBenchmark): unknown {
    const obj: any = {};
    if (message.cpuScore !== 0) {
      obj.cpuScore = Math.round(message.cpuScore);
    }
    if (message.cpuBenchmark !== "") {
      obj.cpuBenchmark = message.cpuBenchmark;
    }
    if (message.cpuCoresCount !== 0) {
      obj.cpuCoresCount = Math.round(message.cpuCoresCount);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<TeeRunCpuBenchmark>, I>>(base?: I): TeeRunCpuBenchmark {
    return TeeRunCpuBenchmark.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<TeeRunCpuBenchmark>, I>>(object: I): TeeRunCpuBenchmark {
    const message = createBaseTeeRunCpuBenchmark();
    message.cpuScore = object.cpuScore ?? 0;
    message.cpuBenchmark = object.cpuBenchmark ?? "";
    message.cpuCoresCount = object.cpuCoresCount ?? 0;
    return message;
  },
};

function createBaseTeeRunMemoryBenchmark(): TeeRunMemoryBenchmark {
  return { memBandwidth: 0, memConfirmedSize: 0 };
}

export const TeeRunMemoryBenchmark = {
  encode(message: TeeRunMemoryBenchmark, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.memBandwidth !== 0) {
      writer.uint32(8).int32(message.memBandwidth);
    }
    if (message.memConfirmedSize !== 0) {
      writer.uint32(16).int32(message.memConfirmedSize);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TeeRunMemoryBenchmark {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTeeRunMemoryBenchmark();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.memBandwidth = reader.int32();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.memConfirmedSize = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TeeRunMemoryBenchmark {
    return {
      memBandwidth: isSet(object.memBandwidth) ? globalThis.Number(object.memBandwidth) : 0,
      memConfirmedSize: isSet(object.memConfirmedSize) ? globalThis.Number(object.memConfirmedSize) : 0,
    };
  },

  toJSON(message: TeeRunMemoryBenchmark): unknown {
    const obj: any = {};
    if (message.memBandwidth !== 0) {
      obj.memBandwidth = Math.round(message.memBandwidth);
    }
    if (message.memConfirmedSize !== 0) {
      obj.memConfirmedSize = Math.round(message.memConfirmedSize);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<TeeRunMemoryBenchmark>, I>>(base?: I): TeeRunMemoryBenchmark {
    return TeeRunMemoryBenchmark.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<TeeRunMemoryBenchmark>, I>>(object: I): TeeRunMemoryBenchmark {
    const message = createBaseTeeRunMemoryBenchmark();
    message.memBandwidth = object.memBandwidth ?? 0;
    message.memConfirmedSize = object.memConfirmedSize ?? 0;
    return message;
  },
};

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
