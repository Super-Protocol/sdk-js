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

    return await new Promise((resolve, reject) => {
        const checkTimes = (): void => {
            checkedTimes += 1;
            if (checkedTimes >= retryMax) {
                reject(new Error(`checkWithInterval: MaxCheck count reached!}`));
            } else {
                setTimeout(timeoutFn, retryInterval);
            }
        };

        const timeoutFn = async (): Promise<void> => {
            try {
                const result = await handler();
                const isResultOk = checkResult ? checkResult(result).isResultOk : true;
                if (isResultOk) {
                    resolve(result);

                    return;
                }
                checkTimes();
            } catch (err) {
                const isErrorRetryable = checkError ? checkError(err).retryable : true;
                if (!isErrorRetryable) {
                    reject(err);

                    return;
                }
                checkTimes();
            }
        };

        setTimeout(timeoutFn, startDelay);
    });
};
