import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "trace" });

export default logger;
