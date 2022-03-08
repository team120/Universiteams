import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { TokenExpirationTimes } from '../utils/token-expiration/token-expiration-times';
import { EmailService, EMAIL_SENDERS, IEmailSender } from './email.service';
import { NodemailerEmailSender } from './nodemailer.email-sender';
import { SendGridEmailSender } from './sendgrid.email-sender';
import { SendInBlueEmailSender } from './sendinblue.email-sender';
import { VerificationMessagesService } from './verification-messages.service';

@Module({
  imports: [ConfigModule, SerializationModule],
  providers: [
    EmailService,
    VerificationMessagesService,
    NodemailerEmailSender,
    SendGridEmailSender,
    SendInBlueEmailSender,
    {
      provide: TokenExpirationTimes,
      useValue: new TokenExpirationTimes({
        emailVerificationToken: { value: 30, dimension: 'minutes' },
      }),
    },
    {
      provide: EMAIL_SENDERS,
      useFactory: (...emailSenders: IEmailSender[]) => emailSenders,
      inject: [
        SendGridEmailSender,
        SendInBlueEmailSender,
        NodemailerEmailSender,
      ],
    },
  ],
  exports: [EmailService, VerificationMessagesService],
})
export class EmailModule {}