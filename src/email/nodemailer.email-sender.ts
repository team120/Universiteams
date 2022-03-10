import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import * as nodemailer from 'nodemailer';
import { IEmailSender, EmailMessage } from './email.processor';

@Injectable()
export class NodemailerEmailSender implements IEmailSender {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(NodemailerEmailSender.name);
  }

  async sendMail(emailMessage: EmailMessage) {
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const message: nodemailer.SendMailOptions = {
      from: `${emailMessage.from.name} <${emailMessage.from.email}>`,
      to: `${emailMessage.to.name} <${emailMessage.to.email}>`,
      subject: emailMessage.subject,
      text: emailMessage.text,
      html: emailMessage.html,
    };

    try {
      const result = await transporter.sendMail(message);
      this.logger.info(nodemailer.getTestMessageUrl(result).toString());
    } catch (err) {
      this.logger.error(
        err as Error,
        `Nodemailer failed to send this email ${emailMessage.subject} ${emailMessage.to.email}`,
      );
      throw err;
    }
  }
}
