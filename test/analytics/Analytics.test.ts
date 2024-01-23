import Analytics from '../../src/analytics/Analytics';
import NodeEventProvider from '../../src/analytics/eventProviders/NodeEventProvider';
import BrowserEventProvider from '../../src/analytics/eventProviders/BrowserEventProvider';
import { AnalyticsEvent, Transport, Logger } from '../../src/analytics/types';

const EVENT_NAME = 'test event';
const USER_ID = '123';
const DEVICE_ID = '80efc2d5-a44c-5db3-901a-16c60e8e79fb';
const API_KEY = '789';
const API_URL = 'https://example.com';
const ERROR_MESSAGE = 'test error';
const PLATFORM_NODE = 'spctl';
const ENGINE_VERSION_NODE = 'v18.17.0';
const OS_NAME_NODE = 'Linux';
const ENGINE_NODE = 'node';
const PLATFORM_WEB = 'web';
const ENGINE_VERSION_WEB = '120.0.0.0';
const OS_NAME_WEB = 'Mac OS';
const ENGINE_WEB = 'Chrome';

class CustomTransport implements Transport {
  async send(serverUrl: string, payload: AnalyticsEvent): Promise<AnalyticsEvent> {
    return new Promise((res) => res(payload));
  }
}

class CustomLogger implements Logger {
  log = jest.fn(() => {})
}

class CustomErrorTransport implements Transport {
  async send() {
    throw new Error(ERROR_MESSAGE);
  }
}

jest.mock(
  '../../src/analytics/transports/AxiosTransport.ts',
  jest.fn(() => class {
    async send(serverUrl: string, payload: AnalyticsEvent): Promise<AnalyticsEvent> {
      return payload;
    }
  }),
);


Object.defineProperty(global, 'navigator', {
  value: {
    ...global.navigator,
    userAgent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`,
  },
  configurable: true,
  writable: true,
});

Object.defineProperties(process, {
  version: {
    value: 'v18.17.0',
    configurable: true,
    writable: true,
  },
  platform: {
    value: 'linux',
    configurable: true,
    writable: true,
  },
})

const nodeEventProvider = new NodeEventProvider({ userId: USER_ID, deviceId: DEVICE_ID, platform: PLATFORM_NODE });
const browserEventProvider = new BrowserEventProvider({ userId: USER_ID, deviceId: DEVICE_ID });
const customTransport = new CustomTransport();
const customErrorTransport = new CustomErrorTransport();

describe('Analytics', () => {
  describe('Analytics with NodeEventProvider', () => {
    let analytics: Analytics;
    beforeEach(() => {
      analytics = new Analytics({
        apiUrl: API_URL,
        apiKey: API_KEY,
        eventProvider: nodeEventProvider,
      });
    });

    test('trackEvent', async () => {
      const result = await analytics.trackEvent({ eventName: EVENT_NAME });
      const event = result.events[0];
      const { eventName, engineVersion, engine, osName, platform, userId, deviceId } = event;
      expect(eventName).toEqual(EVENT_NAME);
      expect(engineVersion).toEqual(ENGINE_VERSION_NODE);
      expect(engine).toEqual(ENGINE_NODE);
      expect(osName).toEqual(OS_NAME_NODE);
      expect(platform).toEqual(PLATFORM_NODE);
      expect(userId).toEqual(USER_ID);
      expect(deviceId).toEqual(DEVICE_ID);
    });

    test('trackEvents', async () => {
      const result = await analytics.trackEvents({ events: [{ eventName: EVENT_NAME }] });
      const event = result.events[0];
      const { eventName, engineVersion, engine, osName, platform, userId, deviceId } = event;
      expect(eventName).toEqual(EVENT_NAME);
      expect(engineVersion).toEqual(ENGINE_VERSION_NODE);
      expect(engine).toEqual(ENGINE_NODE);
      expect(osName).toEqual(OS_NAME_NODE);
      expect(platform).toEqual(PLATFORM_NODE);
      expect(userId).toEqual(USER_ID);
      expect(deviceId).toEqual(DEVICE_ID);
    });

    test('trackEvents with eventProperties', async () => {
      const result = await analytics.trackEvents({ events: [{ eventName: EVENT_NAME, eventProperties: { test: 123 } }] });
      const event = result.events[0];
      const { eventName, eventProperties } = event;
      expect(eventName).toEqual(EVENT_NAME);
      expect(eventProperties).toEqual(JSON.stringify({ test: 123 }));
    })
  });

  describe('Analytics BrowserEventProvider', () => {
    let analytics: Analytics;
    beforeEach(() => {
      analytics = new Analytics({
        apiUrl: API_URL,
        apiKey: API_KEY,
        eventProvider: browserEventProvider,
      });
    });

    test('trackEvent', async () => {
      const result = await analytics.trackEvent({ eventName: EVENT_NAME });
      const event = result.events[0];
      const { eventName, engineVersion, engine, osName, platform, userId, deviceId } = event;
      expect(eventName).toEqual(EVENT_NAME);
      expect(engineVersion).toEqual(ENGINE_VERSION_WEB);
      expect(engine).toEqual(ENGINE_WEB);
      expect(osName).toEqual(OS_NAME_WEB);
      expect(platform).toEqual(PLATFORM_WEB);
      expect(userId).toEqual(USER_ID);
      expect(deviceId).toEqual(DEVICE_ID);
    });

    test('trackEvents', async () => {
      const result = await analytics.trackEvents({ events: [{ eventName: EVENT_NAME }] });
      const event = result.events[0];
      const { eventName, engineVersion, engine, osName, platform, userId, deviceId } = event;
      expect(eventName).toEqual(EVENT_NAME);
      expect(engineVersion).toEqual(ENGINE_VERSION_WEB);
      expect(engine).toEqual(ENGINE_WEB);
      expect(osName).toEqual(OS_NAME_WEB);
      expect(platform).toEqual(PLATFORM_WEB);
      expect(userId).toEqual(USER_ID);
      expect(deviceId).toEqual(DEVICE_ID);
    });

    test('trackEvents with eventProperties', async () => {
      const result = await analytics.trackEvents({ events: [{ eventName: EVENT_NAME, eventProperties: { test: 123 } }] });
      const event = result.events[0];
      const { eventName, eventProperties } = event;
      expect(eventName).toEqual(EVENT_NAME);
      expect(eventProperties).toEqual(JSON.stringify({ test: 123 }));
    })

    test('transport', async () => {
      analytics = new Analytics({
        apiUrl: API_URL,
        apiKey: API_KEY,
        eventProvider: browserEventProvider,
        transport: customTransport,
      });
      const result = await analytics.trackEvent({ eventName: EVENT_NAME });
      const event = result.events[0];
      const { eventName, engineVersion, engine, osName, platform, userId, deviceId } = event;
      expect(eventName).toEqual(EVENT_NAME);
      expect(engineVersion).toEqual(ENGINE_VERSION_WEB);
      expect(engine).toEqual(ENGINE_WEB);
      expect(osName).toEqual(OS_NAME_WEB);
      expect(platform).toEqual(PLATFORM_WEB);
      expect(userId).toEqual(USER_ID);
      expect(deviceId).toEqual(DEVICE_ID);
    })
  });

  test('transport', async () => {
    const analytics = new Analytics({
      apiUrl: API_URL,
      apiKey: API_KEY,
      eventProvider: nodeEventProvider,
      transport: customTransport,
    });
    const result = await analytics.trackEvent({ eventName: EVENT_NAME });
    const event = result.events[0];
    const { eventName, engineVersion, engine, osName, userId, deviceId, platform } = event;
    expect(eventName).toEqual(EVENT_NAME);
    expect(engineVersion).toEqual(ENGINE_VERSION_NODE);
    expect(platform).toEqual(PLATFORM_NODE);
    expect(engine).toEqual(ENGINE_NODE);
    expect(osName).toEqual(OS_NAME_NODE);
    expect(userId).toEqual(USER_ID);
    expect(deviceId).toEqual(DEVICE_ID);
  })

  test('catched', async () => {
    const analytics = new Analytics({
      apiUrl: API_URL,
      apiKey: API_KEY,
      eventProvider: nodeEventProvider,
      transport: customErrorTransport,
    });
    await analytics.trackEvent({ eventName: EVENT_NAME, catched: true })
    expect(true).toBe(true);
    await analytics.trackEvents({ events: [{ eventName: EVENT_NAME }], catched: true });
    expect(true).toBe(true);
  })

  test('no catched', async () => {
    const analytics = new Analytics({
      apiUrl: API_URL,
      apiKey: API_KEY,
      eventProvider: nodeEventProvider,
      transport: customErrorTransport,
    });
    try {
      await analytics.trackEvent({ eventName: EVENT_NAME })
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toEqual(new Error(ERROR_MESSAGE))
    }
    try {
      await analytics.trackEvents({ events: [{ eventName: EVENT_NAME }]});
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toEqual(new Error(ERROR_MESSAGE))
    }
  })

  test('logger', async () => {
    const logger = new CustomLogger();
    const analytics = new Analytics({
      apiUrl: API_URL,
      apiKey: API_KEY,
      eventProvider: nodeEventProvider,
      transport: customErrorTransport,
      logger,
    });
    await analytics.trackEvent({ eventName: EVENT_NAME, catched: true });
    expect(logger.log).toHaveBeenCalledTimes(1);
    try {
      await analytics.trackEvent({ eventName: EVENT_NAME });
    } catch (e) {
      expect(logger.log).toHaveBeenCalledTimes(1);
    }
    await analytics.trackEvent({ eventName: EVENT_NAME, catched: true });
    expect(logger.log).toHaveBeenCalledTimes(2);
    await analytics.trackEvents({ events: [{ eventName: EVENT_NAME }], catched: true });
    expect(logger.log).toHaveBeenCalledTimes(3);
  })
});

