export interface TryWithIntervalParams<T> {
    handler: () => Promise<T>;
    checkResult?: (result: T) => { isResultOk: boolean };
    checkError?: (err: unknown) => { retryable: boolean };
    retryInterval: number;
    retryMax: number;
}

export const tryWithInterval = async <T>(params: TryWithIntervalParams<T>): Promise<T> => {
    let interval: NodeJS.Timer | null = null;
    let checkedTimes = 0;
    const { handler, checkResult, checkError, retryInterval, retryMax } = params;

    const checkTimes = (): void => {
        checkedTimes += 1;
        if (checkedTimes >= retryMax) {
            throw new Error(`checkWithInterval: MaxCheck count reached!}`);
        }
    };

    try {
        return await new Promise((resolve, reject) => {
            const intervalFn = async (): Promise<void> => {
                try {
                    const result = await handler();
                    const isResultOk = checkResult ? checkResult(result).isResultOk : true;
                    if (isResultOk) {
                        resolve(result);
                    }

                    checkTimes();
                } catch (err) {
                    const isErrorRetryable = checkError ? checkError(err).retryable : true;
                    if (!isErrorRetryable) {
                        reject(err);
                    }

                    checkTimes();
                }
            };

            interval = setInterval(intervalFn, retryInterval);
        });
    } finally {
        clearInterval(interval!);
    }
};
