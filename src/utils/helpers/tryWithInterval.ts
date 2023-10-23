export interface TryWithIntervalParams<T> {
  handler: () => Promise<T>;
  checkResult?: (result: T) => { isResultOk: boolean };
  checkError?: (err: unknown) => { retryable: boolean };
  startDelay?: number;
  retryInterval: number;
  retryMax: number;
}

export const tryWithInterval = async <T>(params: TryWithIntervalParams<T>): Promise<T> => {
  let checkedTimes = 0;
  const { handler, checkResult, checkError, startDelay = 0, retryInterval, retryMax } = params;

  const reachedMaxRetries = (): boolean => checkedTimes >= retryMax;

  return await new Promise((resolve, reject) => {
    const scheduleNewIteration = (delay: number): void => {
      checkedTimes += 1;
      setTimeout(timeoutFn, delay);
    };

    const timeoutFn = async (): Promise<void> => {
      try {
        const result = await handler();
        const isResultOk = checkResult ? checkResult(result).isResultOk : true;
        if (isResultOk) {
          resolve(result);

          return;
        }
        if (reachedMaxRetries()) {
          reject(new Error(`${tryWithInterval.name}: MaxCheck count reached!`));

          return;
        }
      } catch (err) {
        const isErrorRetryable = checkError ? checkError(err).retryable : true;
        if (!isErrorRetryable || reachedMaxRetries()) {
          reject(err);

          return;
        }
      }

      scheduleNewIteration(retryInterval);
    };

    scheduleNewIteration(startDelay);
  });
};
