import { Compression } from '../proto/Compression';
import { GzipCompressor, UncompressedCompressor } from '../utils/compressors';

export class ModelPackager {
    private static compressors = [GzipCompressor, UncompressedCompressor];

    /**
     * Compressing message with best algorithm
     *
     * @param message - message
     * @returns Compressed message in bytes representation
     */
    public static async pack<T = unknown>(message: T): Promise<Buffer> {
        const promises = ModelPackager.compressors.map(async (Compressor) => {
            const compressorInstance = new Compressor();
            const data = await compressorInstance.compress(message);

            return {
                compressionType: Compressor.type,
                data,
                size: data.byteLength,
            };
        });

        const options = await Promise.all(promises);
        options.sort((first, second) => first.size - second.size);
        const minimal = options[0];

        const encoded = Compression.encode({
            type: minimal.compressionType,
            data: minimal.data,
        }).finish();

        return Buffer.from(encoded);
    }

    /**
     * Uncompressing message
     *
     * @param message - message with bytes representation
     * @returns original message
     */
    public static async unpack<T = unknown>(message: Buffer): Promise<T> {
        const decoded = Compression.decode(message);

        const Compressor = ModelPackager.compressors.find(
            (CompressorClass) => CompressorClass.type === decoded.type,
        );

        if (!Compressor) {
            throw new Error(`Cannot unpack message. Compressor ${decoded.type} isn't supported`);
        }

        return new Compressor<T>().decompress(Buffer.from(decoded.data));
    }
}
