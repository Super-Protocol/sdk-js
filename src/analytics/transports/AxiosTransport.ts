import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { AnalyticsError } from '../AnalyticsError.js';
import { Transport, AnalyticsEvent } from '../types.js';
import util from 'util';

export default class AxiosTransport<Response> implements Transport<Response> {
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
        validateStatus: (status) => status < 300,
      };
      const response = await axios(config);
      return response.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        throw new AnalyticsError({
          code: err.response?.status || null,
          message: `${err.message}. Error details: ${util.inspect(err.response?.data.message, { compact: true })}`,
        });
      }
      throw new AnalyticsError({ code: null, message: (err as Error)?.message })
    }
  }
}
