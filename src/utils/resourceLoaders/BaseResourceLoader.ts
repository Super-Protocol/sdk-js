import { Readable } from 'stream';
import { Resource } from '@super-protocol/dto-js';
import { IResourceLoader } from '../../types/ResourceLoader';

export abstract class BaseResourceLoader implements IResourceLoader {
  public abstract download(resource: Resource): Promise<Buffer>;

  public abstract downloadToFile(resource: Resource, downloadPath: string): Promise<void>;

  protected async downloadToBuffer(readableStream: Readable): Promise<Buffer> {
    const buffer: Uint8Array[] = [];

    for await (const chunk of readableStream) {
      buffer.push(chunk);
    }

    return Buffer.concat(buffer);
  }
}
