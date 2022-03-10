import { Inject } from '@nestjs/common';
import { SecretsVaultKeys } from '../utils/secrets';
import { User } from '../user/user.entity';
import { VerificationMessagesService } from './verification-messages.service';
import { ConfigService } from '@nestjs/config';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PinoLogger } from 'nestjs-pino';

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

@Processor('emails')
export class EmailProcessor {
  private selectedSender = 0;

  constructor(
    @Inject(EMAIL_SENDERS)
    private readonly emailSenders: Array<IEmailSender>,
    private readonly verificationEmailToken: VerificationMessagesService,
    private readonly logger: PinoLogger,
    private readonly config: ConfigService,
  ) {
    if (emailSenders.length === 0)
      throw new Error('No email senders configured');
  }

  @Process('email-verification')
  async sendVerificationEmail(job: Job<User>) {
    const user = job.data;
    const verificationLink =
      await this.verificationEmailToken.generateVerifyEmailUrl(user);

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
        "<p>Welcome to Universiteams. We are excited to have you on-board and there's just one step to verify if it's actually your e-mail address:</p>" +
        '<p style="text-align:center">' +
        `<a href="${verificationLink}" style="background-color:#32c766;color:white;padding:15px 32px;text-decoration:none;padding:15px 32px;display:inline-block;font-size:16px;border-radius:7px">Confirm Account</a>` +
        '</p>',
    };

    await this.emailSenders[this.selectedSender]
      .sendMail(message)
      .catch((err: Error) => {
        this.logger.error(err, err.message);
      });

    this.logger.debug(
      `Verification email to ${message.to.email} successfully registered to be sent`,
    );
    return {};
  }

  @Process('forgot-password')
  async sendForgetPasswordEmail(job: Job<User>) {
    const user = job.data;
    const verificationLink =
      await this.verificationEmailToken.generateForgetPasswordUrl(user);

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

    await this.emailSenders[this.selectedSender]
      .sendMail(message)
      .catch((err: Error) => {
        this.logger.error(err, err.message);
      });

    this.logger.debug(
      `Forgot password email to ${message.to.email} successfully registered to be sent`,
    );
    return {};
  }
}
