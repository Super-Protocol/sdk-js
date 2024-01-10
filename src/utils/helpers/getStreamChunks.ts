import { Readable } from 'stream';

export interface ChunkPart {
  partNumber: number;
  data: Buffer;
  lastPart?: boolean;
}

export async function* getStreamChunks(
  data: Readable,
  chunkSize: number,
): AsyncGenerator<ChunkPart, void, undefined> {
  let partNumber = 1;
  const currentBuffer: { chunks: Buffer[]; length: number } = { chunks: [], length: 0 };

  for await (const buffer of data) {
    currentBuffer.chunks.push(buffer);
    currentBuffer.length += buffer.length;

    while (currentBuffer.length >= chunkSize) {
      /**
       * Concat all the buffers together once if there is more than one to concat. Attempt
       * to minimize concats as Buffer.Concat is an extremely expensive operation.
       */
      const dataChunk =
        currentBuffer.chunks.length > 1
          ? Buffer.concat(currentBuffer.chunks)
          : currentBuffer.chunks[0];

      yield {
        partNumber,
        data: dataChunk.slice(0, chunkSize),
      };

      // Reset the buffer.
      currentBuffer.chunks = [dataChunk.slice(chunkSize)];
      currentBuffer.length = currentBuffer.chunks[0].length;
      partNumber += 1;
    }
  }
  yield {
    partNumber,
    data: Buffer.concat(currentBuffer.chunks),
    lastPart: true,
  };
}
