import nodemailer from "nodemailer";
import { mailTransporter } from "../config/mailer";
import { env } from "../config/env";
import { logger } from "../config/logger";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email and never throws. Email is a best-effort side effect of
 * things like "someone requested a session with you" — a slow or
 * misconfigured SMTP server should never fail the request that triggered
 * it (e.g. `POST /sessions` should still succeed and return 201 even if the
 * notification email fails to send). Failures are logged, not raised.
 */
async function sendEmail(input: SendEmailInput): Promise<void> {
  try {
    const info = await mailTransporter.sendMail({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (env.isDevelopment) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info(
        `Email sent successfully\n` +
          `Recipient: ${input.to}\n` +
          `Message ID: ${info.messageId ?? "N/A"}\n` +
          `Ethereal Preview URL: ${previewUrl || "N/A"}`
      );
    }
  } catch (err) {
    logger.error(`Failed to send email to ${input.to}: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

function baseTemplate(heading: string, bodyHtml: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #2563eb;">${heading}</h2>
      ${bodyHtml}
      <p style="margin-top: 24px; font-size: 13px; color: #64748b;">— The PeerConnect team</p>
    </div>
  `;
}

export const emailService = {
  sendEmail,

  async sendVerificationOtp(to: string, otp: string): Promise<void> {
    const subject = "PeerConnect Student Verification OTP";
    const html = baseTemplate(
      "Verify your email",
      `<p>Hi,</p>
       <p>Your PeerConnect verification code is <strong>${otp}</strong>.</p>
       <p>This OTP expires in ${env.OTP_EXPIRES_MINUTES} minutes.</p>
       <p>If you did not request this code, you can ignore this email.</p>`
    );
    await sendEmail({ to, subject, html });
  },

  async sendSessionRequestEmail(params: {
    receiverEmail: string;
    receiverName: string;
    requesterName: string;
    skill: string;
    scheduledDate: Date;
  }): Promise<void> {
    await sendEmail({
      to: params.receiverEmail,
      subject: `${params.requesterName} requested a learning session with you`,
      html: baseTemplate(
        "New session request",
        `<p>Hi ${params.receiverName},</p>
         <p><strong>${params.requesterName}</strong> requested a session with you on <strong>${params.skill}</strong>,
         proposed for ${params.scheduledDate.toLocaleString()}.</p>
         <p>Log in to PeerConnect to accept or decline.</p>`
      ),
    });
  },

  async sendSessionAcceptedEmail(params: {
    requesterEmail: string;
    requesterName: string;
    receiverName: string;
    skill: string;
    scheduledDate: Date;
  }): Promise<void> {
    await sendEmail({
      to: params.requesterEmail,
      subject: `${params.receiverName} accepted your session request`,
      html: baseTemplate(
        "Session accepted",
        `<p>Hi ${params.requesterName},</p>
         <p><strong>${params.receiverName}</strong> accepted your session request on <strong>${params.skill}</strong>,
         scheduled for ${params.scheduledDate.toLocaleString()}.</p>
         <p>Log in to PeerConnect for details.</p>`
      ),
    });
  },
};
