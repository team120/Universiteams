import { Inject, Injectable } from '@nestjs/common';
import { SecretsVaultKeys } from '../utils/secrets';
import { User } from '../user/user.entity';
import { VerificationEmailTokenService } from './verification-email-token.service';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';

export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

export const EMAIL_SENDERS = 'EMAIL_SENDERS';
export interface IEmailSender {
  sendMail(emailMessage: EmailMessage): Promise<void>;
}

export interface IEmailService {
  sendVerificationEmail(user: User): Promise<void>;
}

@Injectable()
export class EmailService {
  constructor(
    @Inject(EMAIL_SENDERS)
    private readonly emailSenders: Array<IEmailSender>,
    private readonly verificationEmailToken: VerificationEmailTokenService,
    private readonly logger: PinoLogger,
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

    let senderIndex = 0;
    try {
      await this.emailSenders[senderIndex].sendMail(message);
    } catch {
      await this.fallbackEmailSend(++senderIndex, message);
    }
  }

  async fallbackEmailSend(senderIndex: number, message: EmailMessage) {
    if (this.emailSenders[senderIndex] === undefined) {
      this.logger.info(
        `Email ${message.subject} ${message.to} could not be sent since no more email senders are available`,
      );
      return;
    }
    try {
      await this.emailSenders[senderIndex].sendMail(message);
    } catch {
      await this.fallbackEmailSend(++senderIndex, message);
    }
  }
}
