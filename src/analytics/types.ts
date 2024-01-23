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

export interface Transport {
  send(serverUrl: string, payload: AnalyticsEvent): Promise<any>;
}

export interface EventProvider {
  getEvent(eventName: string, eventProperties?: string | object): Event;
}

export interface Logger {
  log: (error: Error) => void;
}

export interface Config {
  apiUrl: string;
  apiKey: string;
  transport?: Transport;
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
  events: { eventName: string, eventProperties?: string | object }[];
  catched?: boolean;
}

export interface TrackEventProp {
  eventName: string;
  eventProperties?: string | object;
  catched?: boolean;
}