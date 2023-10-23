import { Readable } from 'stream';

export const mockReadStream = (data: unknown): Readable => {
  const readable = new Readable();
  readable.push(data);
  readable.push(null);

  return readable;
};
