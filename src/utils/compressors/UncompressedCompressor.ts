import { Compression_TYPE } from '../../proto/Compression';
import { Compressor } from '../../types/Compressor';

export class UncompressedCompressor<T = unknown> implements Compressor<T> {
  public static type = Compression_TYPE.Uncompressed;

  public compress(content: T): Promise<Buffer> {
    const stringified = JSON.stringify(content);

    return Promise.resolve(Buffer.from(stringified));
  }

  public decompress(bytes: Buffer): Promise<T> {
    const stringified = bytes.toString();

    return Promise.resolve(JSON.parse(stringified));
  }
}
