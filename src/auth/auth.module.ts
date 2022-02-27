import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IsAuthService } from './is-auth.service';
import { IsAuthGuard } from './is-auth.guard';
import { TokenExpirationTimes } from './token-expiration-times';
import { TokenService } from './token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    SerializationModule,
    ConfigModule,
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
        accessTokenExpiration: {
          value: 15,
          dimension: 'minutes',
        },
        refreshTokenExpiration: { value: 7, dimension: 'days' },
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
