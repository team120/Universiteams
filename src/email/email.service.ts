import { Inject, Injectable } from '@nestjs/common';
import { SecretsVaultKeys } from '../utils/secrets';
import { User } from '../user/user.entity';
import { VerificationEmailTokenService } from './verification-email-token.service';
import { ConfigService } from '@nestjs/config';

export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface IEmailSender {
  name: string;
  sendMail(emailMessage: EmailMessage): Promise<void>;
}

export const EMAIL_SENDERS = 'EMAIL_SENDERS';

export interface IEmailService {
  sendVerificationEmail(user: User): Promise<void>;
}

@Injectable()
export class EmailService {
  constructor(
    @Inject(EMAIL_SENDERS)
    private readonly emailSenders: Map<string, IEmailSender>,
    private readonly verificationEmailToken: VerificationEmailTokenService,
    private readonly config: ConfigService,
  ) {}

  async sendVerificationEmail(user: User) {
    const verificationLink =
      this.verificationEmailToken.generateVerificationUrl(user);

    const message: EmailMessage = {
      from: `Alejandro <${this.config.get(SecretsVaultKeys.EMAIL_USER)}>`,
      to: `${user.firstName} ${user.lastName} <${user.email}>`,
      subject: 'Please confirm your email',
      text:
        `Hello ${user.firstName},` +
        "Welcome to Universi. We are excited to have you on-board and there's just one step to verify if it's actually your e-mail address:</p>" +
        `link="${verificationLink}" Confirm Account`,
      html:
        `<h1>Hello ${user.firstName},</h1>` +
        "<p>Welcome to Universi. We are excited to have you on-board and there's just one step to verify if it's actually your e-mail address:</p>" +
        '<p style="text-align:center">' +
        `<a href="${verificationLink}" style="background-color:#32c766;color:white;padding:15px 32px;text-decoration:none;padding:15px 32px;display:inline-block;font-size:16px;border-radius:7px">Confirm Account</a>` +
        '</p>',
    };

    try {
      await this.emailSenders.get('nodemailer').sendMail(message);
    } catch {
      await this.emailSenders.get('sendgrid').sendMail(message);
    }
  }
}
