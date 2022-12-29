import rootLogger from "../logger";

export class Monitoring {
    private static instance: Monitoring;
    private logger = rootLogger.child({ className: "Monitoring" });
    private contractMethodCalls = new Map<string, number>();

    private constructor() {}

    static getInstance(): Monitoring {
        if (!Monitoring.instance) {
            Monitoring.instance = new Monitoring();
            Monitoring.instance.initializeLogging();
        }

        return Monitoring.instance;
    }

    private initializeLogging() {
        const checkInterval = process.env.PRINT_CONTRACT_CALLS_INTERVAL;
        if (!checkInterval) return;
        const startTs = Date.now();
        setInterval(() => {
            this.logger.debug({ stopwatch: Date.now() - startTs }, "Contract methods calls");
            this.contractMethodCalls.forEach((value, key) =>
                this.logger.debug({
                    methodName: key,
                    calledTimes: value,
                }),
            );
        }, +checkInterval);
    }

    incrementCall(methodName: string) {
        const prevValue = this.contractMethodCalls.get(methodName) || 0;
        this.contractMethodCalls.set(methodName, prevValue + 1);
    }
}
