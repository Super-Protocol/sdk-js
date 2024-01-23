import NodeEventProvider from '../../src/analytics/eventProviders/NodeEventProvider';

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

describe('NodeEventProvider', () => {
  const PLATFORM = 'spctl';
  const ENGINE_VERSION = 'v18.17.0';
  const OS_NAME = 'Linux';
  const ENGINE = 'node';
  const EVENT_NAME = 'test event';
  const USER_ID = '123';
  const DEVICE_ID = '80efc2d5-a44c-5db3-901a-16c60e8e79fb';
  test('getEvent', () => {
    const provider = new NodeEventProvider({ userId: USER_ID, platform: PLATFORM });
    const { userId, deviceId, language, platform, osName, engineVersion, engine, eventName } = provider.getEvent(EVENT_NAME);
    expect(userId).toEqual(USER_ID);
    expect(eventName).toEqual(EVENT_NAME);
    expect(deviceId).toEqual(DEVICE_ID);
    expect(osName).toEqual(OS_NAME);
    expect(engineVersion).toEqual(ENGINE_VERSION);
    expect(language).toBeDefined();
    expect(platform).toEqual(PLATFORM);
    expect(engine).toEqual(ENGINE);
  })
})