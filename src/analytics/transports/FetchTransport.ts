import { AnalyticsError } from '../AnalyticsError';
import { Transport, AnalyticsEvent } from '../types';

export default class FetchTransport<Response = any> implements Transport {
  async send(serverUrl: string, payload: AnalyticsEvent): Promise<Response> {
    if (typeof fetch === 'undefined') {
      throw new AnalyticsError({ code: null, message: 'fetch is not supported' });
    }
    try {
      const options: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
        },
        body: JSON.stringify(payload),
        method: 'POST',
      };
      const response = await fetch(serverUrl, options);
      const result = await response.json();
      if (response.ok) {
        return result;
      }
      throw new AnalyticsError({ code: response.status, message: result?.error });
    } catch (e) {
      throw new AnalyticsError({ code: null, message: (e as Error)?.message });
    }
  }
}