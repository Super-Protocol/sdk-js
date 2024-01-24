import AxiosTransport from './transports/AxiosTransport';
import {
  Transport,
  Config,
  EventProvider,
  Event,
  TrackEventsProp,
  TrackEventProp,
  Logger,
} from './types';

export default class Analytics<TransportResponse> {
  private readonly transport: Transport<TransportResponse>;
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly eventProvider: EventProvider;
  private readonly logger?: Logger;

  constructor(config: Config<TransportResponse>) {
    const { apiUrl, apiKey, transport, eventProvider, logger } = config || {};
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.eventProvider = eventProvider;
    this.logger = logger;
    this.transport = transport || new AxiosTransport<TransportResponse>();
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

  private async catchEvent(
    func: () => Promise<TransportResponse | null>,
  ): Promise<TransportResponse | null> {
    try {
      const result = await func();
      return result;
    } catch (e) {
      if (this.logger) {
        this.logger.log(e as Error);
      }
      return null;
    }
  }

  public trackEvent(props: TrackEventProp): Promise<TransportResponse> {
    const { eventName, eventProperties } = props;
    const event = this.getEvent(eventName, eventProperties);
    return this.transport.send(this.apiUrl, {
      events: [event],
      apiKey: this.apiKey,
    });
  }

  public trackEventCatched(props: TrackEventProp): Promise<TransportResponse | null> {
    return this.catchEvent(() => this.trackEvent(props));
  }

  public trackEvents(props: TrackEventsProp): Promise<TransportResponse> {
    const { events } = props;
    return this.transport.send(this.apiUrl, {
      events: events.map(({ eventName, eventProperties }) =>
        this.getEvent(eventName, eventProperties),
      ),
      apiKey: this.apiKey,
    });
  }

  public trackEventsCatched(props: TrackEventsProp): Promise<TransportResponse | null> {
    return this.catchEvent(() => this.trackEvents(props));
  }
}
