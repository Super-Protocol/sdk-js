import UAParser from 'ua-parser-js';
import { EventProvider, Event, BrowserEventProviderProp } from '../types';

export default class BrowserEventProvider implements EventProvider {
  private readonly userId: string;
  private readonly language: string;
  private readonly date: string;
  private readonly platform: string;
  private readonly osName: string;
  private readonly engine: string;
  private readonly engineVersion: string;
  private readonly deviceId: string;

  constructor(event: BrowserEventProviderProp) {
    const {
      userId, deviceId,
    } = event;
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

  private getLanguage() {
    return ((typeof navigator !== 'undefined' && (navigator?.languages?.[0] || navigator.language)) || '');
  }

  private getDate() {
    return new Date().toISOString();
  }
}