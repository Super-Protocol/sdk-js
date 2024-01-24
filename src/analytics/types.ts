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

export interface AnalyticsEvent {
  events: Event[];
  apiKey: string;
}

export interface Transport<Response> {
  send(serverUrl: string, payload: AnalyticsEvent): Promise<Response>;
}

export interface EventProvider {
  getEvent(eventName: string, eventProperties?: string | object): Event;
}

export interface Logger {
  log: (error: Error) => void;
}

export interface Config<TransportResponse> {
  apiUrl: string;
  apiKey: string;
  transport?: Transport<TransportResponse>;
  eventProvider: EventProvider;
  logger?: Logger;
}

export interface NodeEventProviderProp {
  userId: string;
  platform: string;
  deviceId?: string;
}

export interface BrowserEventProviderProp {
  userId: string;
  deviceId: string;
}

export interface TrackEventsProp {
  events: { eventName: string; eventProperties?: string | object }[];
}

export interface TrackEventProp {
  eventName: string;
  eventProperties?: string | object;
}
