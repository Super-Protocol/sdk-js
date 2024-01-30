import EventProvider, { Event } from './eventProviders/EventProvider';

export interface AnalyticsEvent {
  events: Event[];
  apiKey: string;
}

export interface Transport<Response> {
  send(serverUrl: string, payload: AnalyticsEvent): Promise<Response>;
}

export interface Config<TransportResponse> {
  apiUrl: string;
  apiKey: string;
  transport?: Transport<TransportResponse>;
  eventProvider: EventProvider;
  showLogs?: boolean;
}

export interface TrackEventProp {
  eventName: string;
  eventProperties?: string | object;
}

export interface TrackEventsProp {
  events: TrackEventProp[];
}
