import BrowserEventProvider from '../../src/analytics/eventProviders/BrowserEventProvider';

Object.defineProperty(global, 'navigator', {
  value: {
    ...global.navigator,
    userAgent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`,
  },
  configurable: true,
  writable: true,
});

describe('BrowserEventProvider', () => {
  const PLATFORM = 'web';
  const ENGINE_VERSION = '120.0.0.0';
  const OS_NAME = 'Mac OS';
  const ENGINE = 'Chrome';
  const EVENT_NAME = 'test event';
  const USER_ID = '123';
  const DEVICE_ID = '80efc2d5-a44c-5db3-901a-16c60e8e79fb';
  test('getEvent', () => {
    const provider = new BrowserEventProvider({ userId: USER_ID, deviceId: DEVICE_ID });
    const { userId, deviceId, language, platform, osName, engineVersion, engine, eventName } = provider.getEvent(EVENT_NAME);
    expect(eventName).toEqual(EVENT_NAME);
    expect(userId).toEqual(USER_ID);
    expect(deviceId).toEqual(DEVICE_ID);
    expect(osName).toEqual(OS_NAME);
    expect(engineVersion).toEqual(ENGINE_VERSION);
    expect(language).toBeDefined();
    expect(platform).toEqual(PLATFORM);
    expect(engine).toEqual(ENGINE);
  })
})