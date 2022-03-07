import { Inject, Injectable } from '@nestjs/common';
import { SecretsVaultKeys } from '../utils/secrets';
import { User } from '../user/user.entity';
import { VerificationMessagesService } from './verification-messages.service';
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
    private readonly verificationEmailToken: VerificationMessagesService,
    private readonly config: ConfigService,
  ) {}

  async sendVerificationEmail(user: User) {
    const verificationLink =
      this.verificationEmailToken.generateVerifyEmailUrl(user);

    const message: EmailMessage = {
      from: {
        email: `${this.config.get(SecretsVaultKeys.EMAIL_USER)}`,
        name: 'Alejandro',
      },
      to: { email: user.email, name: `${user.firstName} ${user.lastName}` },
      subject: 'Please confirm your email',
      text:
        `Hello ${user.firstName},` +
        "Welcome to Universi. We are excited to have you on-board and there's just one step to verify if it's actually your e-mail address:" +
        `link="${verificationLink}" Confirm Account`,
      html:
        `<h1>Hello ${user.firstName},</h1>` +
        "<p>Welcome to Universi. We are excited to have you on-board and there's just one step to verify if it's actually your e-mail address:</p>" +
        '<p style="text-align:center">' +
        `<a href="${verificationLink}" style="background-color:#32c766;color:white;padding:15px 32px;text-decoration:none;padding:15px 32px;display:inline-block;font-size:16px;border-radius:7px">Confirm Account</a>` +
        '</p>',
    };

    await this.sendEmail(message);
  }

  async sendForgetPasswordEmail(user: User) {
    const verificationLink =
      this.verificationEmailToken.generateForgetPasswordUrl(user);

    const message: EmailMessage = {
      from: {
        email: `${this.config.get(SecretsVaultKeys.EMAIL_USER)}`,
        name: 'Alejandro',
      },
      to: { email: user.email, name: `${user.firstName} ${user.lastName}` },
      subject: 'Forgot your password? We can help.',
      text:
        `Hello ${user.firstName},` +
        'Forgot your password? No worries, we’ve got you covered. Click the link below to reset your password.' +
        `link="${verificationLink}" Set new password`,
      html:
        `<h1>Hello ${user.firstName},</h1>` +
        '<p>Forgot your password? No worries, we’ve got you covered. Click the link below to reset your password.</p>' +
        '<p style="text-align:center">' +
        `<a href="${verificationLink}" style="background-color:#32c766;color:white;padding:15px 32px;text-decoration:none;padding:15px 32px;display:inline-block;font-size:16px;border-radius:7px">Set new password</a>` +
        '</p>',
    };

    await this.sendEmail(message);
  }

  private async sendEmail(message: EmailMessage) {
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
