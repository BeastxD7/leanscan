/**
 * Email service — Gmail SMTP via Nodemailer.
 * 500/day free Gmail limit covers V1; upgrade to Google Workspace ($6/mo)
 * when we have > 500 weekly-report recipients.
 */
import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.GMAIL_USER,
        pass: config.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  const t = getTransporter();
  try {
    const result = await t.sendMail({
      from: `"${config.EMAIL_FROM_NAME}" <${config.GMAIL_USER}>`,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    });
    logger.info({ to: msg.to, subject: msg.subject, id: result.messageId }, 'email sent');
  } catch (err) {
    logger.error({ err, to: msg.to, subject: msg.subject }, 'failed to send email');
    throw err;
  }
}

// =============================================================
// Templates — editorial brand voice, no shame, plain copy
// =============================================================

export function passwordResetEmailTemplate(opts: {
  resetUrl: string;
  expiresInMinutes: number;
}): Omit<EmailMessage, 'to'> {
  const { resetUrl, expiresInMinutes } = opts;
  return {
    subject: 'Reset your LeanScan password',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #2a2a2a;">
        <h1 style="font-family: Georgia, serif; color: #1a3a2e; font-weight: 500; font-size: 24px; margin: 0 0 16px;">Reset your password</h1>
        <p style="font-size: 15px; line-height: 1.6;">Tap the button below to set a new password. The link expires in ${expiresInMinutes} minutes.</p>
        <p style="margin: 32px 0;">
          <a href="${resetUrl}" style="background: #1a3a2e; color: #f5f1ea; padding: 14px 28px; border-radius: 100px; text-decoration: none; font-weight: 600; font-size: 14px;">Reset password</a>
        </p>
        <p style="font-size: 13px; color: #6b6b6b; line-height: 1.6;">Or paste this link into your browser:<br><span style="word-break: break-all;">${resetUrl}</span></p>
        <p style="font-size: 13px; color: #6b6b6b; margin-top: 32px;">If you didn't request this, you can ignore this email — your password won't change.</p>
        <p style="font-size: 12px; color: #6b6b6b; margin-top: 32px; border-top: 1px solid #e5e5e5; padding-top: 16px;">— LeanScan</p>
      </div>
    `,
    text:
      `Reset your LeanScan password\n\n` +
      `Use this link to set a new password (expires in ${expiresInMinutes} minutes):\n` +
      `${resetUrl}\n\n` +
      `If you didn't request this, you can ignore this email — your password won't change.\n\n` +
      `— LeanScan`,
  };
}

export function welcomeEmailTemplate(opts: { email: string }): Omit<EmailMessage, 'to'> {
  return {
    subject: 'Welcome to LeanScan',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #2a2a2a;">
        <h1 style="font-family: Georgia, serif; color: #1a3a2e; font-weight: 500; font-size: 28px; margin: 0 0 16px;">You're in.</h1>
        <p style="font-size: 16px; line-height: 1.6;">Welcome to LeanScan, ${opts.email}. The app is set up to put protein first — open it whenever you want to log a meal, weigh in, or log a workout.</p>
        <p style="font-size: 15px; line-height: 1.6; color: #6b6b6b; margin-top: 32px;">— Shashank</p>
      </div>
    `,
    text:
      `Welcome to LeanScan, ${opts.email}.\n\n` +
      `The app is set up to put protein first — open it whenever you want to log a meal, weigh in, or log a workout.\n\n` +
      `— Shashank`,
  };
}
