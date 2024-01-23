import AxiosTransport from './transports/AxiosTransport';
import { Transport, Config, EventProvider, Event, TrackEventsProp, TrackEventProp, Logger } from './types';

export default class Analytics {
  private readonly transport: Transport;
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly eventProvider: EventProvider;
  private readonly logger?: Logger;

  constructor(config: Config) {
    const {
      apiUrl, apiKey, transport, eventProvider, logger,
    } = config || {};
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.eventProvider = eventProvider;
    this.logger = logger;
    this.transport = transport || new AxiosTransport();
  }
  
  private getEvent(eventName: string, eventProperties?: string | object): Event {
    if (!eventName) {
      throw new Error('eventName required');
    }
    if (!this.apiUrl) {
      throw new Error('Api url required');
    }
    if (!this.apiKey) {
      throw new Error('Api key required');
    }
    return this.eventProvider.getEvent(eventName, eventProperties);
  }

  private async catchEvent(func: () => Promise<any>) {
    try {
      const result = await func();
      return result;
    } catch (e) {
      if (this.logger) {
        this.logger.log(e as Error);
      }
    }
  }

  private async _trackEvent(props: Omit<TrackEventProp, 'catched'>) {
    const { eventName, eventProperties } = props;
    const event = this.getEvent(eventName, eventProperties);
      return this.transport
        .send(
          this.apiUrl,
          {
            events: [event],
            apiKey: this.apiKey
          }
        );
  }

  public async trackEvent(props: TrackEventProp) {
    return props?.catched ? this.catchEvent(() => this._trackEvent(props)) : this._trackEvent(props);
  }

  private async _trackEvents(props: Omit<TrackEventsProp, 'catched'>) {
    const { events } = props;
    return this.transport
      .send(
        this.apiUrl,
        {
          events: events.map(({ eventName, eventProperties }) => this.getEvent(eventName, eventProperties)),
          apiKey: this.apiKey
        }
      );
  }

  public async trackEvents(props: TrackEventsProp) {
    return props?.catched ? this.catchEvent(() => this._trackEvents(props)) : this._trackEvents(props);
  }
}