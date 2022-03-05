import { Injectable } from '@nestjs/common';
import { EmailMessage, IEmailSender } from './email.service';
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
    try {
      await this.sendGridApi.send(emailMessage);
    } catch (err) {
      this.logger.error(
        err as Error,
        `SendGrid failed to send this email ${emailMessage.subject} ${emailMessage.to}`,
      );
      throw err;
    }
  }
}
