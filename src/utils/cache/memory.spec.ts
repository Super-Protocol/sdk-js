import { MemoryCache } from './memory.js';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('wrap', () => {
    it('wrap method retrieves value from cache and calls function if not in cache', async () => {
      const mockFunction = jest.fn(() => 'result') as never;

      await cache.wrap('key', mockFunction);
      await cache.wrap('key', mockFunction);
      expect(mockFunction).toHaveBeenCalledTimes(1);
      expect(cache.get('key')).toBe('result');
    });

    it('wrap method does not updates value in cache if key is existed', async () => {
      const mockFunction = jest.fn(() => 'new result') as never;

      cache.add('key', 'old result');
      await cache.wrap('key', mockFunction);
      expect(mockFunction).not.toHaveBeenCalled();
      expect(cache.get('key')).toBe('old result');
    });

    it('wrap method updates value in cache with ttl', async () => {
      const mockFunction = jest.fn(() => 'new result') as never;

      await cache.wrap('key', mockFunction, { ttl: 1 });
      expect(cache.get('key')).toBe('new result');

      jest.advanceTimersByTime(2000);
      expect(cache.get('key')).toBeUndefined();
    });
  });

  describe('add', () => {
    it('add method adds value to the cache', () => {
      expect(cache.add('key', 'value')).toBe(true);
      expect(cache.add('key', 'value')).toBe(false);
      expect(cache.add('nullKey', null)).toBe(true);
    });

    it('add method with ttl adds value to the cache and expires correctly', () => {
      cache.add('key', 'value', 1);
      expect(cache.get('key')).toBe('value');

      jest.advanceTimersByTime(1000);
      expect(cache.get('key')).toBe('value');

      jest.advanceTimersByTime(2000);
      expect(cache.get('key')).toBeUndefined();
      expect(cache.add('key', 'new value')).toBe(true);
      expect(cache.get('key')).toBe('new value');
    });
  });

  it('get method retrieves value from the cache', () => {
    cache.add('key', 'value');
    cache.add('nullKey', null);
    expect(cache.get('key')).toBe('value');
    expect(cache.get('nullKey')).toBeNull();
  });

  it('del method removes value from the cache', () => {
    cache.add('key', 'value');
    expect(cache.get('key')).toBe('value');
    cache.del('key');
    expect(cache.get('key')).toBeUndefined();
  });

  it('set method updates value in the cache', () => {
    cache.add('key', 'value');
    expect(cache.get('key')).toBe('value');
    cache.set('key', 'new value');
    expect(cache.get('key')).toBe('new value');
    cache.set('nullKey', null);
    expect(cache.get('nullKey')).toBeNull();
  });
});
