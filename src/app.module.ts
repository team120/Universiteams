import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { SerializationModule } from './utils/serialization/serialization.module';
import { ExceptionsModule } from './utils/exceptions/exceptions.module';
import { InstitutionModule } from './institution/institution.module';
import { InterestModule } from './interest/interest.module';
import { ProjectModule } from './project/project.module';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
    }),
    ScheduleModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'prod' ? 'info' : 'debug',
        formatters: {
          level: (level: string) => new Object({ level: level }),
        },
        prettyPrint:
          process.env.NODE_ENV !== 'prod'
            ? {
                colorize: true,
                levelFirst: true,
                translateTime: 'mm/dd/yyyy h:MM:ss TT Z',
              }
            : undefined,
      },
    }),
    SerializationModule,
    ExceptionsModule,
    InstitutionModule,
    InterestModule,
    ProjectModule,
    UserModule,
    DatabaseModule,
    AuthModule,
    EmailModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
