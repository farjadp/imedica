// ============================================================================
// File: apps/backend/src/services/email/EmailService.ts
// Version: 1.0.0 — 2026-04-20
// Why: Wraps Nodemailer for transactional emails. In local dev, Mailhog
//      captures all outbound email (no real sends). In production, swap
//      the transport for SendGrid (or any SMTP provider).
//
//      PIPEDA note: Email addresses sent through this service stay within
//      Canada for production (SendGrid with Canadian data residency or
//      self-hosted SMTP on DO Toronto). Review data-flows.md before
//      adding new email providers.
//
// Env / Identity: Backend service — handles PII (email addresses in To: field)
// ============================================================================

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { createChildLogger } from '../../lib/logger.js';
import { env } from '../../lib/validate-env.js';

const log = createChildLogger({ service: 'EmailService' });

// ─── Email Templates ──────────────────────────────────────────────────────────

function emailVerificationTemplate(params: {
  firstName: string | null;
  verificationUrl: string;
}): { subject: string; html: string; text: string } {
  const name = params.firstName ?? 'Paramedic';
  return {
    subject: 'Verify your Imedica account',
    text: `Hi ${name},\n\nVerify your email address by clicking this link:\n${params.verificationUrl}\n\nThis link expires in 24 hours.\n\nImedica Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">Verify your Imedica account</h2>
        <p>Hi ${name},</p>
        <p>Click the button below to verify your email address and activate your account.</p>
        <p>
          <a href="${params.verificationUrl}"
             style="background-color: #0d9488; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email
          </a>
        </p>
        <p style="color: #6b7280; font-size: 0.875rem;">
          This link expires in 24 hours. If you didn't create an account, you can ignore this email.
        </p>
        <p>If the button doesn't work, copy this URL: ${params.verificationUrl}</p>
        <hr />
        <p style="color: #6b7280; font-size: 0.75rem;">
          Imedica — Decision-training for Canadian paramedics.
          <br />This email was sent to you because an account was created with your address.
        </p>
      </div>
    `,
  };
}

function passwordResetTemplate(params: {
  firstName: string | null;
  resetUrl: string;
}): { subject: string; html: string; text: string } {
  const name = params.firstName ?? 'there';
  return {
    subject: 'Reset your Imedica password',
    text: `Hi ${name},\n\nReset your password by clicking:\n${params.resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email — your password has not changed.\n\nImedica Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">Reset your password</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your Imedica password.</p>
        <p>
          <a href="${params.resetUrl}"
             style="background-color: #0d9488; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p style="color: #6b7280; font-size: 0.875rem;">
          This link expires in 1 hour. If you didn't request a password reset, ignore this email.
          Your password has not been changed.
        </p>
        <p>If the button doesn't work, copy this URL: ${params.resetUrl}</p>
        <hr />
        <p style="color: #6b7280; font-size: 0.75rem;">Imedica — Decision-training for Canadian paramedics.</p>
      </div>
    `,
  };
}

// ─── EmailService ─────────────────────────────────────────────────────────────

export class EmailService {
  private transporter: Transporter;

  constructor() {
    const config = env();
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth:
        config.SMTP_USER && config.SMTP_PASS
          ? { user: config.SMTP_USER, pass: config.SMTP_PASS }
          : undefined,
    });
    log.debug('Email transport initialized', {
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
    });
  }

  // ─── Public Send Methods ───────────────────────────────────────────────────

  /** Sends an email verification link to the user. */
  async sendVerificationEmail(params: {
    to: string;
    firstName: string | null;
    token: string;
  }): Promise<void> {
    const { subject, html, text } = emailVerificationTemplate({
      firstName: params.firstName,
      verificationUrl: `${env().APP_URL}/auth/verify-email?token=${params.token}`,
    });
    await this.send({ to: params.to, subject, html, text });
  }

  /** Sends a password reset link to the user. */
  async sendPasswordResetEmail(params: {
    to: string;
    firstName: string | null;
    token: string;
  }): Promise<void> {
    const { subject, html, text } = passwordResetTemplate({
      firstName: params.firstName,
      resetUrl: `${env().APP_URL}/auth/reset-password?token=${params.token}`,
    });
    await this.send({ to: params.to, subject, html, text });
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private async send(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${env().EMAIL_FROM_NAME}" <${env().EMAIL_FROM}>`,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
      log.debug('Email sent', {
        messageId: String(info.messageId),
        // Log only that an email was sent — not the recipient (PII)
        subject: params.subject,
      });
    } catch (error) {
      // Log the error but don't propagate (email failure should not crash auth)
      log.error('Failed to send email', {
        subject: params.subject,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Singleton instance
export const emailService = new EmailService();
