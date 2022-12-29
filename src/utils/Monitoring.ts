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
            this.contractMethodCalls.forEach((value, key) =>
                this.logger.debug({
                    methodName: key,
                    calledTimes: value,
                }),
            );
            const totalCalls = Array.from(this.contractMethodCalls.values()).reduce((acc, curr) => acc + curr, 0);
            const timeSpend = Math.floor((Date.now() - startTs) / (60 * 1000));
            this.logger.debug(
                {
                    timeSpend: timeSpend + " min",
                    totalCalls,
                },
                "Contract methods calls",
            );
        }, +checkInterval);
    }

    incrementCall(methodName: string) {
        const prevValue = this.contractMethodCalls.get(methodName) || 0;
        this.contractMethodCalls.set(methodName, prevValue + 1);
    }
}
