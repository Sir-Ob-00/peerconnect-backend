import nodemailer from "nodemailer";
import { env } from "./env";
import { logger } from "./logger";

export const mailTransporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

if (env.isDevelopment) {
  mailTransporter.verify((error) => {
    if (error) {
      const details = [
        `SMTP configuration error: the configured SMTP server at ${env.SMTP_HOST}:${env.SMTP_PORT} is not reachable.`,
        `Check SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD in .env.`,
        `SMTP error: ${error.message}`,
      ];
      if ((error as any).code) details.push(`Code: ${(error as any).code}`);
      if ((error as any).command) details.push(`Command: ${(error as any).command}`);
      if ((error as any).response) details.push(`Response: ${(error as any).response}`);
      if ((error as any).responseCode) details.push(`ResponseCode: ${(error as any).responseCode}`);
      logger.error(details.join("\n"));
    } else {
      logger.info("SMTP connection verified successfully — Ethereal ready");
    }
  });
}
