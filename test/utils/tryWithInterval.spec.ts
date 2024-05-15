import { tryWithInterval } from '../../src/utils/helpers/index.js';

describe('tryWithInterval', () => {
  let retryInterval: number;
  let retryMax: number;

  beforeEach(() => {
    retryInterval = 100;
    retryMax = 3;
  });

  it('should resolve handler on the first try', async () => {
    const handler = jest.fn().mockResolvedValue(true);

    const result = await tryWithInterval({
      handler,
      retryInterval,
      retryMax,
    });

    expect(handler).toBeCalledTimes(1);
    expect(result).toBe(true);
  });

  it('should resolve handler on the last try', async () => {
    const handler = jest
      .fn()
      .mockRejectedValueOnce(false)
      .mockRejectedValueOnce(false)
      .mockResolvedValue(true);

    const result = await tryWithInterval({
      handler,
      retryInterval,
      retryMax,
    });

    expect(handler).toBeCalledTimes(3);
    expect(result).toBe(true);
  });

  it('should reject with handler error when handler rejects', async () => {
    const expectedErrorMessage = 'handler failed';

    const handler = jest.fn().mockRejectedValue(new Error(expectedErrorMessage));

    await expect(
      tryWithInterval({
        handler,
        retryInterval,
        retryMax,
      }),
    ).rejects.toThrow(expectedErrorMessage);
    expect(handler).toBeCalledTimes(3);
  });

  it('should reject with default error when max retries reached', async () => {
    const expectedErrorMessage = `${tryWithInterval.name}: MaxCheck count reached!`;

    const handler = jest.fn().mockResolvedValue(true);
    const checkResult = jest.fn().mockReturnValue(false);

    await expect(
      tryWithInterval({
        handler,
        checkResult,
        retryInterval,
        retryMax: 3,
      }),
    ).rejects.toThrow(expectedErrorMessage);
    expect(handler).toBeCalledTimes(3);
  });
});
