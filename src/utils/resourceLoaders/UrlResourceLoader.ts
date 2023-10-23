import fs from 'fs';
import http from 'http';
import https from 'https';
import stream from 'stream';
import { Resource, ResourceType, UrlResource } from '@super-protocol/dto-js';
import { BaseResourceLoader } from './BaseResourceLoader';

export class UrlResourceLoader extends BaseResourceLoader {
  public static type = ResourceType.Url;

  public async download(resource: Resource): Promise<Buffer> {
    const downloadStream = await this.getFileStream(resource as UrlResource);

    return this.downloadToBuffer(downloadStream);
  }

  public async downloadToFile(resource: Resource, downloadPath: string): Promise<void> {
    const downloadStream = await this.getFileStream(resource as UrlResource);

    await stream.promises.pipeline(downloadStream, fs.createWriteStream(downloadPath));
  }

  private getFileStream(resource: UrlResource): Promise<stream.Readable> {
    let { url } = resource;

    return new Promise((resolve, reject): void => {
      const fileProtocol = 'file://';

      if (url.startsWith(fileProtocol)) {
        url = url.substring(fileProtocol.length);
        try {
          const response: fs.ReadStream = fs.createReadStream(url);
          resolve(response);
        } catch (error: unknown) {
          reject(error);
        }
      } else {
        const module: typeof https | typeof http = url.startsWith('https:') ? https : http;
        module
          .get(url, (response: http.IncomingMessage): void => {
            resolve(response);
          })
          .on('error', (error: Error): void => {
            reject(error);
          });
      }
    });
  }
}
