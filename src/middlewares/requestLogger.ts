import morgan from "morgan";
import { env } from "../config/env";
import { morganStream } from "../config/logger";

/**
 * Access-log middleware. Uses morgan's "dev" format (concise, colored) in
 * development and a more detailed combined-style format in production,
 * writing through winston so all logs share one destination.
 */
export const requestLogger = morgan(env.isProduction ? "combined" : "dev", {
  stream: morganStream,
  skip: () => env.isTest,
});
