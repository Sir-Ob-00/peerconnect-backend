import winston from "winston";
import { env } from "./env";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) => `${ts} [${level}] ${stack ?? message}`)
);

const prodFormat = combine(timestamp(), errors({ stack: true }), winston.format.json());

/**
 * Central logger. Use this instead of console.log everywhere so log level,
 * formatting, and (later) transports like file/remote logging stay
 * consistent across the app.
 */
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: env.isProduction ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
});

/** Stream adapter so morgan's HTTP access logs flow through winston too. */
export const morganStream = {
  write: (message: string) => logger.http(message.trim()),
};
