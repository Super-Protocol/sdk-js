import _ from 'lodash';
import AxiosTransport from './transports/AxiosTransport.js';
import EventProvider, { Event } from './eventProviders/EventProvider.js';
import {
  Transport,
  AnalyticsConfig,
  TrackEventsProp,
  TrackEventProp,
  TrackEventObjProp,
} from './types.js';
import logger, { Logger } from '../logger.js';

export default class Analytics<TransportResponse> {
  private readonly transport: Transport<TransportResponse>;
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly eventProvider: EventProvider;
  private readonly logger?: Logger | null;

  constructor(config: AnalyticsConfig<TransportResponse>) {
    const { apiUrl, apiKey, transport, eventProvider, showLogs } = config || {};
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.eventProvider = eventProvider;
    this.logger = showLogs ? logger.child({ class: Analytics.name }) : null;
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
    } catch (err) {
      this.logger?.error({ err }, 'Analytics event not sent');
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

  public trackSuccessEventCatched(props: TrackEventObjProp): Promise<TransportResponse | null> {
    const eventProperties = {
      ...(_.isPlainObject(props.eventProperties) && props.eventProperties),
      result: 'success',
    };
    return this.catchEvent(() => this.trackEvent({ eventName: props.eventName, eventProperties }));
  }

  public trackErrorEventCatched(
    props: TrackEventObjProp,
    error: unknown,
  ): Promise<TransportResponse | null> {
    const eventProperties = {
      ...(_.isPlainObject(props.eventProperties) && props.eventProperties),
      result: 'error',
      error: (error as Error).message || 'Unknown error',
      errorStack: (error as Error).stack || '',
    };

    return this.catchEvent(() => this.trackEvent({ eventName: props.eventName, eventProperties }));
  }
}
