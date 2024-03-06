import nodeGzip from 'node-gzip';
import { Compression_TYPE } from '../../proto/Compression.js';
import { Compressor } from '../../types/Compressor.js';

const { gzip, ungzip } = nodeGzip;

export class GzipCompressor<T> implements Compressor<T> {
  public static type = Compression_TYPE.GZIP;

  public compress(content: T): Promise<Buffer> {
    const stringified = JSON.stringify(content);

    return gzip(stringified);
  }

  public async decompress(bytes: Buffer): Promise<T> {
    const stringified = await ungzip(bytes);

    return JSON.parse(stringified.toString());
  }
}
