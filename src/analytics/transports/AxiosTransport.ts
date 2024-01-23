import axios, { AxiosRequestConfig } from 'axios';
import { AnalyticsError } from '../AnalyticsError';
import { Transport, AnalyticsEvent } from '../types';

export default class AxiosTransport<Response = any> implements Transport {
  async send(serverUrl: string, payload: AnalyticsEvent): Promise<Response> {
    try {
      const config: AxiosRequestConfig = {
        url: serverUrl,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
        },
        data: payload,
      };
      const response = await axios(config)
      if (response.status > 299) {
        throw new AnalyticsError({ code: response.status, message: response.statusText });
      }
      return response.data;
    } catch (e) {
      throw new AnalyticsError({ code: null, message: (e as Error)?.message });
    }
  }
}