import pino from "pino";

const logger = pino({
    level: process.env.LOG_LEVEL || "trace",
    enabled: process.env.DISABLE_LOGGER !== "true",
});

export default logger;
