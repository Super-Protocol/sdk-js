import { v5 as uuidv5 } from 'uuid';
import EventProvider from './EventProvider.js';

export interface NodeEventProviderProp {
  userId: string;
  platform: string;
  deviceId?: string;
}

export default class NodeEventProvider extends EventProvider {
  protected readonly userId: string;
  protected readonly language: string;
  protected readonly date: string;
  protected readonly platform: string;
  protected readonly osName: string;
  protected readonly engine: string;
  protected readonly engineVersion: string;
  protected readonly deviceId: string;

  constructor(event: NodeEventProviderProp) {
    super();
    const { userId, deviceId, platform } = event;
    this.userId = userId;
    this.language = this.getLanguage();
    this.date = this.getDate();
    this.osName = this.getOsName();
    this.engine = 'node';
    this.platform = platform;
    this.engineVersion = this.getEngineVersion();
    this.deviceId = deviceId || this.getDeviceId();
  }

  private getOsName(): string {
    switch (process.platform) {
      case 'darwin':
        return 'Mac OS';
      case 'linux':
        return 'Linux';
      case 'win32':
        return 'Windows';
      default:
        return process.platform;
    }
  }

  private getEngineVersion(): string {
    return process.version;
  }

  private getDeviceId(): string {
    const UUID_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
    return uuidv5(this.engineVersion + this.platform + this.osName, UUID_NAMESPACE);
  }

  private getLanguage(): string {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  }

  private getDate(): string {
    return new Date().toISOString();
  }
}
