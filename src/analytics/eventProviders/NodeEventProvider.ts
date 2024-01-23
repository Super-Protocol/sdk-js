import { v5 as uuidv5 } from 'uuid';
import { EventProvider, Event, NodeEventProviderProp } from '../types';

export default class NodeEventProvider implements EventProvider {
  private readonly userId: string;
  private readonly language: string;
  private readonly date: string;
  private readonly osName: string;
  private readonly engine: string;
  private readonly engineVersion: string;
  private readonly deviceId: string;
  private readonly platform: string;

  constructor(event: NodeEventProviderProp) {
    const {
      userId, deviceId, platform,
    } = event;
    this.userId = userId;
    this.language = this.getLanguage();
    this.date = this.getDate();
    this.osName = this.getOsName();
    this.engine = 'node';
    this.platform = platform;
    this.engineVersion = this.getEngineVersion();
    this.deviceId = deviceId || this.getDeviceId();
  }

  public getEvent(eventName: string, eventProperties?: string | object): Event {
    return {
      userId: this.userId,
      eventName,
      language: this.language,
      date: this.date,
      platform: this.platform,
      osName: this.osName,
      engineVersion: this.engineVersion,
      engine: this.engine,
      deviceId: this.deviceId,
      ...(eventProperties ? { eventProperties: this.getEventProperties(eventProperties) } : {}),
    };
  }

  private getEventProperties(eventProperties?: string | object) {
    return eventProperties && typeof eventProperties !== 'string' ? JSON.stringify(eventProperties) : eventProperties;
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

  private getEngineVersion() {
    return process.version;
  }

  private getDeviceId() {
    const UUID_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
    return uuidv5(this.engineVersion + this.platform + this.osName, UUID_NAMESPACE);
  }

  private getLanguage() {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  }

  private getDate() {
    return new Date().toISOString();
  }
}