import { Injectable } from '@nestjs/common';
import { EmailMessage, IEmailSender } from './email.processor';
import * as sendInBlue from '@sendinblue/client';
import { ConfigService } from '@nestjs/config';
import { SecretsVaultKeys } from '../utils/secrets';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class SendInBlueEmailSender implements IEmailSender {
  private apiInstance = new sendInBlue.TransactionalEmailsApi();
  constructor(config: ConfigService, private readonly logger: PinoLogger) {
    this.apiInstance.setApiKey(
      sendInBlue.TransactionalEmailsApiApiKeys.apiKey,
      config.get(SecretsVaultKeys.SENDINBLUE_API_KEY),
    );
  }
  async sendMail(emailMessage: EmailMessage): Promise<void> {
    const message: sendInBlue.SendSmtpEmail = {
      sender: emailMessage.from,
      replyTo: emailMessage.from,
      to: emailMessage.to,
      bcc: emailMessage.bcc,
      subject: emailMessage.subject,
      htmlContent: emailMessage.html,
      textContent: emailMessage.text,
    };

    try {
      const result = await this.apiInstance.sendTransacEmail(message);
      this.logger.debug(
        `SendInBlue sendMail response status: ${result.response.statusCode.toString()}`,
      );
    } catch (err) {
      this.logger.error(
        err as Error,
        `SendInBlue failed to send this email ${
          emailMessage.subject
        } ${emailMessage.to.map((to) => to.email).join(', ')}`,
      );
      throw err;
    }
  }
}
