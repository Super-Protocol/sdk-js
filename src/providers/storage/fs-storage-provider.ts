import { Readable } from 'stream';
import StorageObject from '../../types/storage/StorageObject.js';
import IStorageProvider, { DownloadConfig } from './IStorageProvider.js';
import { createReadStream, createWriteStream, Stats } from 'node:fs';
import { FSCredentials } from '@super-protocol/dto-js';
import * as path from 'node:path';
import { Writable } from 'node:stream';
import { readdir, rm, stat } from 'node:fs/promises';
import { access, constants as FS_CONSTANTS, mkdir } from 'fs/promises';
import { NotFoundError } from '../../errors/index.js';

export class FSStorageProvider implements IStorageProvider {
  private readonly bucket: string;
  private readonly prefix: string;

  constructor(credentials: FSCredentials) {
    this.bucket = credentials.bucket;
    this.prefix = credentials.prefix;
  }

  private getFullPath(remotePath: string): string {
    return path.join(this.bucket, this.prefix, remotePath);
  }

  private writeWithProgress(
    inputStream: Readable,
    outputStream: Writable,
    contentLength: number,
    progressListener?: (total: number, current: number) => void,
  ): Promise<void> {
    let bytesWritten = 0;

    return new Promise<void>((resolve, reject) => {
      outputStream.on('close', resolve).on('error', reject);
      inputStream
        .once('data', (chunk) => {
          const canContinue = outputStream.write(chunk);
          if (!canContinue) {
            inputStream.pause();
            outputStream.once('drain', inputStream.resume.bind(inputStream));

            bytesWritten += chunk.length;
            if (!!progressListener) {
              progressListener(contentLength, bytesWritten);
            }
          }
        })
        .on('end', () => {
          outputStream.end();
        })
        .on('error', reject);
    });
  }

  async uploadFile(
    inputStream: Readable,
    remotePath: string,
    contentLength: number,
    progressListener?: ((total: number, current: number) => void) | undefined,
  ): Promise<void> {
    if (!inputStream) {
      throw new Error('Input stream is undefined');
    }

    const fullPath = this.getFullPath(remotePath);
    await this.ensureDirectoryExists(path.dirname(fullPath));

    const outputStream = createWriteStream(fullPath);
    await this.writeWithProgress(inputStream, outputStream, contentLength, progressListener);
  }

  async downloadFile(
    remotePath: string,
    config: DownloadConfig,
    progressListener?: ((total: number, current: number) => void) | undefined,
  ): Promise<Readable> {
    const offset = config.offset ?? 0;
    const filePath = this.getFullPath(remotePath);
    let stats: Stats;
    try {
      stats = await stat(filePath);
    } catch {
      throw new NotFoundError(`File does not exist: ${filePath}`);
    }
    const total = offset + (config.length ?? 0) || stats.size;
    let current = offset;
    const readStream = createReadStream(filePath, {
      start: offset,
      end: total,
    });

    readStream.on('data', (chunk) => {
      current += chunk.length;
      if (progressListener) {
        progressListener(total, current);
      }
    });

    return readStream;
  }

  async deleteObject(remotePath: string): Promise<void> {
    await rm(this.getFullPath(remotePath), { force: true });
  }

  private async ensureDirectoryExists(directory: string, createIfNotExists = true): Promise<void> {
    try {
      await access(directory, FS_CONSTANTS.F_OK);
    } catch (error) {
      if (createIfNotExists) {
        await mkdir(directory, { recursive: true });
      } else {
        throw new NotFoundError(`Directory does not exist: ${directory}`);
      }
    }
  }

  async listObjects(remotePath: string): Promise<StorageObject[]> {
    const fullPath = this.getFullPath(remotePath);
    await this.ensureDirectoryExists(fullPath);
    const dirents = await readdir(fullPath, { withFileTypes: true });

    return Promise.all(
      dirents.map(async (dirent) => {
        const direntPath = path.join(fullPath, dirent.name);
        const direntStat = await stat(direntPath);
        return {
          name: dirent.name,
          size: direntStat.size,
          isFolder: dirent.isDirectory(),
          createdAt: direntStat.birthtime,
          ...(dirent.isDirectory() && { childrenCount: (await readdir(direntPath)).length }),
        };
      }),
    );
  }

  async getObjectSize(remotePath: string): Promise<number> {
    const fileStat = await stat(this.getFullPath(remotePath));

    return fileStat.size;
  }

  async getLastModified(remotePath: string): Promise<Date | null> {
    const fileStat = await stat(this.getFullPath(remotePath));

    return fileStat.mtime;
  }
}
