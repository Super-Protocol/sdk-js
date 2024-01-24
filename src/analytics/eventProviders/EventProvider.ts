export interface Event {
  userId: string;
  eventName: string;
  deviceId: string;
  date: string;
  platform: string;
  osName: string;
  engineVersion: string;
  engine: string;
  language: string;
  eventProperties?: string;
}

export default abstract class EventProvider {
  protected abstract userId: string;
  protected abstract language: string;
  protected abstract date: string;
  protected abstract platform: string;
  protected abstract osName: string;
  protected abstract engine: string;
  protected abstract engineVersion: string;
  protected abstract deviceId: string;

  private getEventProperties(eventProperties?: string | object): string | undefined {
    return eventProperties && typeof eventProperties !== 'string'
      ? JSON.stringify(eventProperties)
      : eventProperties;
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
}
