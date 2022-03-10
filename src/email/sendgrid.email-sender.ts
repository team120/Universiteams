import { Injectable } from '@nestjs/common';
import { EmailMessage, IEmailSender } from './email.processor';
import * as sendgrid from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';
import { SecretsVaultKeys } from '../utils/secrets';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class SendGridEmailSender implements IEmailSender {
  private readonly sendGridApi = sendgrid;

  constructor(config: ConfigService, private readonly logger: PinoLogger) {
    this.sendGridApi.setApiKey(config.get(SecretsVaultKeys.SENDGRID_API_KEY));
    this.logger.setContext(SendGridEmailSender.name);
  }

  async sendMail(emailMessage: EmailMessage): Promise<void> {
    const message: sendgrid.MailDataRequired = {
      from: `${emailMessage.from.name} <${emailMessage.from.email}>`,
      to: `${emailMessage.to.name} <${emailMessage.to.email}>`,
      subject: emailMessage.subject,
      text: emailMessage.text,
      html: emailMessage.html,
    };

    try {
      const result = await this.sendGridApi.send(message);
      this.logger.debug(
        `SendGrid sendMail response status: ${result[0].statusCode}`,
      );
    } catch (err) {
      this.logger.error(
        err as Error,
        `SendGrid failed to send this email ${emailMessage.subject} ${emailMessage.to.email}`,
      );
      throw err;
    }
  }
}
