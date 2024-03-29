import UAParser from 'ua-parser-js';
import EventProvider from './EventProvider';

export interface BrowserEventProviderProp {
  userId: string;
  deviceId: string;
}

export default class BrowserEventProvider extends EventProvider {
  protected readonly userId: string;
  protected readonly language: string;
  protected readonly date: string;
  protected readonly platform: string;
  protected readonly osName: string;
  protected readonly engine: string;
  protected readonly engineVersion: string;
  protected readonly deviceId: string;

  constructor(event: BrowserEventProviderProp) {
    super();
    const { userId, deviceId } = event;
    const userAgent = new UAParser(navigator?.userAgent).getResult();
    this.userId = userId;
    this.deviceId = deviceId;
    this.language = this.getLanguage();
    this.date = this.getDate();
    this.platform = 'web';
    this.osName = userAgent?.os?.name || '';
    this.engineVersion = userAgent?.browser?.version || '';
    this.engine = userAgent?.browser?.name || '';
  }

  private getLanguage(): string {
    return (
      (typeof navigator !== 'undefined' && (navigator?.languages?.[0] || navigator.language)) || ''
    );
  }

  private getDate(): string {
    return new Date().toISOString();
  }
}
