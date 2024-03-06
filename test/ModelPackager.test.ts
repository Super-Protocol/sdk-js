import { Compression, Compression_TYPE } from '../src/proto/Compression.js';
import { ModelPackager } from '../src/staticModels/ModelPackager.js';

describe('ModelPackager', () => {
  test('packing data with lot of text', async () => {
    const textData = {
      number: 100500,
      string:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    };

    const packed = await ModelPackager.pack(textData);
    expect(Compression.decode(packed).type).toEqual(Compression_TYPE.GZIP);

    const unpacked = await ModelPackager.unpack(packed);
    expect(unpacked).toEqual(textData);
  });

  test('packing data with lot of numbers', async () => {
    const numbersData = {
      one: 100200,
      two: 100300,
      three: 100500,
    };

    const packed = await ModelPackager.pack(numbersData);
    expect(Compression.decode(packed).type).toEqual(Compression_TYPE.Uncompressed);

    const unpacked = await ModelPackager.unpack(packed);
    expect(unpacked).toEqual(numbersData);
  });

  test('throws error if compression type is not supported', async () => {
    const compressionItem: Compression = {
      type: 'JPEG' as unknown as Compression_TYPE,
      data: Buffer.alloc(5),
    };

    const compression = Buffer.from(Compression.encode(compressionItem).finish());

    await expect(ModelPackager.unpack(compression)).rejects.toThrowError();
  });
});
