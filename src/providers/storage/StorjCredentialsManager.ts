import { S3Credentials, StorjCredentials, StringifiedCredentials } from '@super-protocol/dto-js';
import {
  AccessResultStruct as Access,
  ProjectResultStruct as Project,
} from '@super-protocol/uplink-nodejs';
import * as storj from '@super-protocol/uplink-nodejs';

export enum CredentialsPermissions {
  read,
  write,
  list,
  delete,
}

export class StorjCredentialsManager {
  private accessToken: string;
  private bucket: string;
  private _uplink: storj.Uplink;
  private _access?: Access;
  private _project?: Project;

  constructor(storageConfig: Pick<StorjCredentials, 'token' | 'bucket'>) {
    this.accessToken = storageConfig.token;
    this.bucket = storageConfig.bucket;
    this._uplink = new storj.Uplink();
  }

  getStorageId(entity: string, entityId: string): string {
    return `${entity}_${entityId}`;
  }

  async create(): Promise<void> {
    const project = await this.lazyProject();
    await project.ensureBucket(this.bucket);
  }

  async acquireCredentials(
    permissions: CredentialsPermissions[],
    prefix: string,
  ): Promise<StringifiedCredentials<StorjCredentials>> {
    const readPerm = permissions.includes(CredentialsPermissions.read),
      writePerm = permissions.includes(CredentialsPermissions.write),
      listPerm = permissions.includes(CredentialsPermissions.list),
      deletePerm = permissions.includes(CredentialsPermissions.delete);

    const perm = new storj.Permission(readPerm, writePerm, deletePerm, listPerm, 0, 0);
    const sharePrefix = new storj.SharePrefix(this.bucket, prefix + '/');
    const access = await this.lazyAccess();
    const share = await access.share(perm, [sharePrefix], 1);

    return JSON.stringify({
      bucket: this.bucket,
      prefix: prefix + '/',
      token: await share.serialize(),
    });
  }

  async acquireS3Credentials(
    permissions: CredentialsPermissions[],
    prefix: string,
  ): Promise<S3Credentials> {
    const storjCreds = await this.acquireCredentials(permissions, prefix);
    return this.getS3Credentials(storjCreds);
  }

  async getS3Credentials(stringifiedCredentials: StringifiedCredentials): Promise<S3Credentials>;
  async getS3Credentials(storjCredentials: StorjCredentials): Promise<S3Credentials>;
  async getS3Credentials(creds: StorjCredentials | StringifiedCredentials): Promise<S3Credentials> {
    const storjCredentials: StorjCredentials =
      typeof creds === 'string' ? JSON.parse(creds) : creds;
    const access = await this.lazyAccess();
    const s3Credentials = await access.registerS3Credentials(storjCredentials.token);

    return {
      accessKeyId: s3Credentials.accessKeyId,
      secretKey: s3Credentials.secretKey,
      endpoint: s3Credentials.endpoint,
      bucket: storjCredentials.bucket,
      prefix: storjCredentials.prefix,
    };
  }

  async revokeCredentials(
    credentialString: StringifiedCredentials<StorjCredentials>,
  ): Promise<void> {
    const credentials: StorjCredentials = JSON.parse(credentialString);
    const access = await this.parseAccess(credentials.token);
    const project = await this.lazyProject();

    await project.revokeAccess(access);
  }

  private parseAccess(access: string): Promise<Access> {
    return this._uplink.parseAccess(access);
  }

  private async lazyAccess(): Promise<Access> {
    if (this._access) {
      return this._access;
    }

    this._access = await this.parseAccess(this.accessToken);

    return this._access!;
  }

  private async lazyProject(): Promise<Project> {
    if (this._project) {
      return this._project;
    }

    const access = await this.lazyAccess();
    this._project = await access.openProject();

    return this._project;
  }
}
