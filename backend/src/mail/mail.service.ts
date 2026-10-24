import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { existsSync } from 'fs';
import { join } from 'path';

const BRAND = {
  name: 'Money Manager',
  deepTeal: '#0B5D55',
  teal: '#0E9C86',
  tealDark: '#0A7D6C',
  green: '#22C55E',
  gold: '#FBBF24',
  mint: '#ECFDF5',
  mintBorder: '#BBF7D0',
  text: '#334155',
  muted: '#64748B',
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private readonly frontendUrl: string;

  private readonly logoUrl: string | null;
  private readonly logoPath = join(process.cwd(), 'assets', 'logo.png');
  private readonly useCidLogo: boolean;

  constructor(config: ConfigService) {
    this.from = config.get<string>('MAIL_FROM') ?? `${BRAND.name} <no-reply@localhost>`;
    this.frontendUrl = config.getOrThrow<string>('FRONTEND_URL');

    this.logoUrl = config.get<string>('MAIL_LOGO_URL') ?? null;
    this.useCidLogo = !this.logoUrl && existsSync(this.logoPath);
    if (!this.logoUrl && !this.useCidLogo) {
      this.logger.warn('No MAIL_LOGO_URL and no assets/logo.png: emails will have no logo');
    }

    const host = config.get<string>('MAIL_HOST');
    if (!host) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MAIL_HOST is required in production');
      }
      this.logger.warn('MAIL_HOST not set: emails will be logged, not sent');
      this.transporter = null;
      return;
    }

    this.transporter = createTransport({
      host,
      port: Number(config.get('MAIL_PORT') ?? 587),
      secure: config.get('MAIL_SECURE') === 'true',
      auth: {
        user: config.getOrThrow<string>('MAIL_USER'),
        pass: config.getOrThrow<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(to: string, rawToken: string, expiresInMin: number) {
    const link = `${this.frontendUrl}/verify-email?token=${rawToken}`;
    await this.send(
      to,
      'Verify your email',
      this.template({
        preheader: 'Confirm your email to activate your account.',
        title: 'Verify your email',
        intro: `Welcome to ${BRAND.name}! Confirm your email address to activate your account and start taking control of your finances.`,
        buttonLabel: 'Verify my email',
        link,
        footer: `This link expires in ${expiresInMin} minutes. If you did not create an account, you can safely ignore this email.`,
      }),
      link,
    );
  }

  async sendPasswordResetEmail(to: string, rawToken: string, expiresInMin: number) {
    const link = `${this.frontendUrl}/reset-password?token=${rawToken}`;
    await this.send(
      to,
      'Reset your password',
      this.template({
        preheader: 'Choose a new password for your account.',
        title: 'Reset your password',
        intro: 'We received a request to reset your password. Click the button below to choose a new one.',
        buttonLabel: 'Choose a new password',
        link,
        footer: `This link expires in ${expiresInMin} minutes. If you did not ask for this, ignore this email: your password will not change.`,
      }),
      link,
    );
  }

  private async send(to: string, subject: string, html: string, link: string) {
    if (!this.transporter) {
      this.logger.warn(`[DEV] Email "${subject}" to ${to} → ${link}`);
      return;
    }
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      html,
      text: `${subject}\n\n${link}`,
      attachments: this.useCidLogo
        ? [{ filename: 'logo.png', path: this.logoPath, cid: 'brand-logo' }]
        : [],
    });
  }

  private template(o: {
    preheader: string;
    title: string;
    intro: string;
    buttonLabel: string;
    link: string;
    footer: string;
  }): string {
    const logoSrc = this.useCidLogo ? 'cid:brand-logo' : this.logoUrl;
    const logoBlock = logoSrc
      ? `<img src="${logoSrc}" width="110" height="110" alt="${BRAND.name}" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;" />`
      : '';
    const year = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${o.title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.mint};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${BRAND.mint};">
    ${o.preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.mint};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 18px rgba(11,93,85,0.12);">

          <tr>
            <td height="3" style="height:3px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <tr>
            <td align="center" style="padding:32px 32px 8px 32px;">
              ${logoBlock}
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;letter-spacing:0.5px;margin-top:10px;">
                ${BRAND.name}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 36px 8px 36px;font-family:Arial,Helvetica,sans-serif;">
              <h1 style="margin:0 0 14px 0;font-size:24px;line-height:30px;color:${BRAND.deepTeal};text-align:center;">
                ${o.title}
              </h1>
              <p style="margin:0;font-size:16px;line-height:25px;color:${BRAND.text};text-align:center;">
                ${o.intro}
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="${BRAND.teal}" style="border-radius:10px;border-bottom:3px solid ${BRAND.tealDark};">
                    <a href="${o.link}" target="_blank"
                       style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px;">
                      ${o.buttonLabel}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 24px 36px;">
              <div style="background-color:${BRAND.mint};border:1px solid ${BRAND.mintBorder};border-radius:10px;padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:${BRAND.muted};">
                If the button does not work, copy this link into your browser:<br>
                <a href="${o.link}" style="color:${BRAND.tealDark};word-break:break-all;">${o.link}</a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 36px 28px 36px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:${BRAND.muted};text-align:center;">
              ${o.footer}
            </td>
          </tr>

          <tr>
            <td align="center" bgcolor="${BRAND.deepTeal}" style="background-color:${BRAND.deepTeal};padding:16px 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#A7F3D0;">
              &copy; ${year} ${BRAND.name}.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}