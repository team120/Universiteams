import { Inject, Injectable } from '@nestjs/common';
import { SecretsVaultKeys } from '../utils/secrets';
import { User } from '../user/user.entity';
import { VerificationEmailTokenService } from './verification-email-token.service';
import { ConfigService } from '@nestjs/config';
import { EmailException } from '../utils/exceptions/exceptions';

export interface EmailMessage {
  from: { name: string; email: string };
  to: { name: string; email: string };
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
    private readonly config: ConfigService,
  ) {}

  async sendVerificationEmail(user: User) {
    const verificationLink =
      this.verificationEmailToken.generateVerificationUrl(user);

    const message: EmailMessage = {
      from: {
        email: `${this.config.get(SecretsVaultKeys.EMAIL_USER)}`,
        name: 'Alejandro',
      },
      to: { email: user.email, name: `${user.firstName} ${user.lastName}` },
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
      throw new EmailException(
        `Email ${message.subject} ${message.to.email} could not be sent since no more email senders are available`,
      );
    }
    try {
      await this.emailSenders[senderIndex].sendMail(message);
    } catch {
      return this.fallbackEmailSend(++senderIndex, message);
    }
  }
}
