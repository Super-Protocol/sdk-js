/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "";

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

export interface TeeDeviceInfo {
    cpus: Cpus[];
    memSize: number;
    totalPhysicalCores: number;
    totalLogicalCores: number;
}

export interface TeeRunCpuBenchmark {
    cpuScore: number;
    cpuBenchmark: string;
    cpuCoresCount: number;
}

export interface TeeRunMemoryBenchmark {
    memBandwidth: number;
    meConfirmedSize: number;
}

export interface TeeProperties {
    teeDeviceInfo: TeeDeviceInfo | undefined;
    teeRunCpuBenchmark: TeeRunCpuBenchmark | undefined;
    teeRunMemoryBenchmark: TeeRunMemoryBenchmark | undefined;
}

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
        const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseCpus();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.vendorId = reader.string();
                    break;
                case 2:
                    message.cpuFamily = reader.int32();
                    break;
                case 3:
                    message.model = reader.int32();
                    break;
                case 4:
                    message.modelName = reader.string();
                    break;
                case 5:
                    message.physicalCores = reader.int32();
                    break;
                case 6:
                    message.logicalCores = reader.int32();
                    break;
                case 7:
                    message.baseFreq = reader.int32();
                    break;
                case 8:
                    message.maxFreq = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): Cpus {
        return {
            vendorId: isSet(object.vendorId) ? String(object.vendorId) : "",
            cpuFamily: isSet(object.cpuFamily) ? Number(object.cpuFamily) : 0,
            model: isSet(object.model) ? Number(object.model) : 0,
            modelName: isSet(object.modelName) ? String(object.modelName) : "",
            physicalCores: isSet(object.physicalCores) ? Number(object.physicalCores) : 0,
            logicalCores: isSet(object.logicalCores) ? Number(object.logicalCores) : 0,
            baseFreq: isSet(object.baseFreq) ? Number(object.baseFreq) : 0,
            maxFreq: isSet(object.maxFreq) ? Number(object.maxFreq) : 0,
        };
    },

    toJSON(message: Cpus): unknown {
        const obj: any = {};
        message.vendorId !== undefined && (obj.vendorId = message.vendorId);
        message.cpuFamily !== undefined && (obj.cpuFamily = Math.round(message.cpuFamily));
        message.model !== undefined && (obj.model = Math.round(message.model));
        message.modelName !== undefined && (obj.modelName = message.modelName);
        message.physicalCores !== undefined && (obj.physicalCores = Math.round(message.physicalCores));
        message.logicalCores !== undefined && (obj.logicalCores = Math.round(message.logicalCores));
        message.baseFreq !== undefined && (obj.baseFreq = Math.round(message.baseFreq));
        message.maxFreq !== undefined && (obj.maxFreq = Math.round(message.maxFreq));
        return obj;
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
        const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseTeeDeviceInfo();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.cpus.push(Cpus.decode(reader, reader.uint32()));
                    break;
                case 2:
                    message.memSize = reader.int32();
                    break;
                case 3:
                    message.totalPhysicalCores = reader.int32();
                    break;
                case 4:
                    message.totalLogicalCores = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): TeeDeviceInfo {
        return {
            cpus: Array.isArray(object?.cpus) ? object.cpus.map((e: any) => Cpus.fromJSON(e)) : [],
            memSize: isSet(object.memSize) ? Number(object.memSize) : 0,
            totalPhysicalCores: isSet(object.totalPhysicalCores) ? Number(object.totalPhysicalCores) : 0,
            totalLogicalCores: isSet(object.totalLogicalCores) ? Number(object.totalLogicalCores) : 0,
        };
    },

    toJSON(message: TeeDeviceInfo): unknown {
        const obj: any = {};
        if (message.cpus) {
            obj.cpus = message.cpus.map((e) => (e ? Cpus.toJSON(e) : undefined));
        } else {
            obj.cpus = [];
        }
        message.memSize !== undefined && (obj.memSize = Math.round(message.memSize));
        message.totalPhysicalCores !== undefined && (obj.totalPhysicalCores = Math.round(message.totalPhysicalCores));
        message.totalLogicalCores !== undefined && (obj.totalLogicalCores = Math.round(message.totalLogicalCores));
        return obj;
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
        const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseTeeRunCpuBenchmark();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.cpuScore = reader.int32();
                    break;
                case 2:
                    message.cpuBenchmark = reader.string();
                    break;
                case 3:
                    message.cpuCoresCount = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): TeeRunCpuBenchmark {
        return {
            cpuScore: isSet(object.cpuScore) ? Number(object.cpuScore) : 0,
            cpuBenchmark: isSet(object.cpuBenchmark) ? String(object.cpuBenchmark) : "",
            cpuCoresCount: isSet(object.cpuCoresCount) ? Number(object.cpuCoresCount) : 0,
        };
    },

    toJSON(message: TeeRunCpuBenchmark): unknown {
        const obj: any = {};
        message.cpuScore !== undefined && (obj.cpuScore = Math.round(message.cpuScore));
        message.cpuBenchmark !== undefined && (obj.cpuBenchmark = message.cpuBenchmark);
        message.cpuCoresCount !== undefined && (obj.cpuCoresCount = Math.round(message.cpuCoresCount));
        return obj;
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
    return { memBandwidth: 0, meConfirmedSize: 0 };
}

export const TeeRunMemoryBenchmark = {
    encode(message: TeeRunMemoryBenchmark, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
        if (message.memBandwidth !== 0) {
            writer.uint32(8).int32(message.memBandwidth);
        }
        if (message.meConfirmedSize !== 0) {
            writer.uint32(16).int32(message.meConfirmedSize);
        }
        return writer;
    },

    decode(input: _m0.Reader | Uint8Array, length?: number): TeeRunMemoryBenchmark {
        const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseTeeRunMemoryBenchmark();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.memBandwidth = reader.int32();
                    break;
                case 2:
                    message.meConfirmedSize = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): TeeRunMemoryBenchmark {
        return {
            memBandwidth: isSet(object.memBandwidth) ? Number(object.memBandwidth) : 0,
            meConfirmedSize: isSet(object.meConfirmedSize) ? Number(object.meConfirmedSize) : 0,
        };
    },

    toJSON(message: TeeRunMemoryBenchmark): unknown {
        const obj: any = {};
        message.memBandwidth !== undefined && (obj.memBandwidth = Math.round(message.memBandwidth));
        message.meConfirmedSize !== undefined && (obj.meConfirmedSize = Math.round(message.meConfirmedSize));
        return obj;
    },

    fromPartial<I extends Exact<DeepPartial<TeeRunMemoryBenchmark>, I>>(object: I): TeeRunMemoryBenchmark {
        const message = createBaseTeeRunMemoryBenchmark();
        message.memBandwidth = object.memBandwidth ?? 0;
        message.meConfirmedSize = object.meConfirmedSize ?? 0;
        return message;
    },
};

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
        const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseTeeProperties();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.teeDeviceInfo = TeeDeviceInfo.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.teeRunCpuBenchmark = TeeRunCpuBenchmark.decode(reader, reader.uint32());
                    break;
                case 3:
                    message.teeRunMemoryBenchmark = TeeRunMemoryBenchmark.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
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
        message.teeDeviceInfo !== undefined &&
            (obj.teeDeviceInfo = message.teeDeviceInfo ? TeeDeviceInfo.toJSON(message.teeDeviceInfo) : undefined);
        message.teeRunCpuBenchmark !== undefined &&
            (obj.teeRunCpuBenchmark = message.teeRunCpuBenchmark
                ? TeeRunCpuBenchmark.toJSON(message.teeRunCpuBenchmark)
                : undefined);
        message.teeRunMemoryBenchmark !== undefined &&
            (obj.teeRunMemoryBenchmark = message.teeRunMemoryBenchmark
                ? TeeRunMemoryBenchmark.toJSON(message.teeRunMemoryBenchmark)
                : undefined);
        return obj;
    },

    fromPartial<I extends Exact<DeepPartial<TeeProperties>, I>>(object: I): TeeProperties {
        const message = createBaseTeeProperties();
        message.teeDeviceInfo =
            object.teeDeviceInfo !== undefined && object.teeDeviceInfo !== null
                ? TeeDeviceInfo.fromPartial(object.teeDeviceInfo)
                : undefined;
        message.teeRunCpuBenchmark =
            object.teeRunCpuBenchmark !== undefined && object.teeRunCpuBenchmark !== null
                ? TeeRunCpuBenchmark.fromPartial(object.teeRunCpuBenchmark)
                : undefined;
        message.teeRunMemoryBenchmark =
            object.teeRunMemoryBenchmark !== undefined && object.teeRunMemoryBenchmark !== null
                ? TeeRunMemoryBenchmark.fromPartial(object.teeRunMemoryBenchmark)
                : undefined;
        return message;
    },
};

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
    : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
    return value !== null && value !== undefined;
}
