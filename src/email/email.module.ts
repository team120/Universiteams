import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { TokenExpirationTimes } from '../utils/token-expiration/token-expiration-times';
import { EmailService, EMAIL_SENDERS, IEmailSender } from './email.service';
import { NodemailerEmailSender } from './nodemailer.email-sender';
import { SendGridEmailSender } from './sendgrid.email-sender';
import { SendInBlueEmailSender } from './sendinblue.email-sender';
import { VerificationEmailTokenService } from './verification-email-token.service';

@Module({
  imports: [ConfigModule, SerializationModule],
  providers: [
    EmailService,
    VerificationEmailTokenService,
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
  exports: [EmailService, VerificationEmailTokenService],
})
export class EmailModule {}
