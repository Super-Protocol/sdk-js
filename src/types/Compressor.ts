import { Compression_TYPE } from "../proto/Compression";

export interface Compressor<T> {
    compress: (content: T) => Promise<Buffer>;
    decompress: (bytes: Buffer) => Promise<T>;
}
