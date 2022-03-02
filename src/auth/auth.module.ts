import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IsAuthService } from './is-auth.service';
import { IsAuthGuard } from './is-auth.guard';
import { TokenService } from './token.service';
import { EmailModule } from '../email/email.module';
import { TokenExpirationTimes } from '../utils/token-expiration/token-expiration-times';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    SerializationModule,
    ConfigModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    IsAuthService,
    IsAuthGuard,
    TokenService,
    {
      provide: TokenExpirationTimes,
      useValue: new TokenExpirationTimes({
        accessToken: {
          value: 15,
          dimension: 'minutes',
        },
        refreshToken: { value: 7, dimension: 'days' },
      }),
    },
  ],
  exports: [
    TypeOrmModule.forFeature([User]),
    SerializationModule,
    ConfigModule,
    IsAuthService,
    IsAuthGuard,
    TokenService,
  ],
})
export class AuthModule {}
