import { S3Credentials, StorjCredentials, StringifiedCredentials } from '@super-protocol/dto-js';
import type {
  AccessResultStruct as Access,
  ProjectResultStruct as Project,
  Uplink,
  Permission,
  SharePrefix,
} from '@super-protocol/uplink-nodejs';

export enum CredentialsPermissions {
  read,
  write,
  list,
  delete,
}

export class StorjCredentialsManager {
  private accessToken: string;
  private bucket: string;
  private access?: Access;
  private project?: Project;

  constructor(storageConfig: Pick<StorjCredentials, 'token' | 'bucket'>) {
    this.accessToken = storageConfig.token;
    this.bucket = storageConfig.bucket;
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

    const storj = await this.lazyStorj();
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
    const storj = await this.lazyStorj();
    const uplink = new storj.Uplink();
    const access = await uplink.parseAccess(credentials.token);
    const project = await this.lazyProject();

    await project.revokeAccess(access);
  }

  private async lazyStorj(): Promise<{
    Uplink: typeof Uplink;
    Permission: typeof Permission;
    SharePrefix: typeof SharePrefix;
  }> {
    return await require('@super-protocol/uplink-nodejs');
  }

  private async lazyAccess(): Promise<Access> {
    if (this.access) {
      return this.access;
    }

    const storj = await this.lazyStorj();
    const uplink = new storj.Uplink();

    this.access = await uplink.parseAccess(this.accessToken);

    return this.access;
  }

  private async lazyProject(): Promise<Project> {
    if (this.project) {
      return this.project;
    }

    const access = await this.lazyAccess();
    this.project = await access.openProject();

    return this.project;
  }
}
