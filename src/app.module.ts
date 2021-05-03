import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { getConnectionOptions } from 'typeorm';

import { AppController } from './app.controller';
import { AuthController } from './auth/auth.controller';
import { SerializationModule } from './serialization/serialization.module';
import { ExceptionsModule } from './exceptions/exceptions.module';

import { InstitutionModule } from './institution/institution.module';
import { InterestModule } from './interest/interest.module';
import { ProjectModule } from './project/project.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () =>
        await getConnectionOptions('development').then((conn) => ({
          ...conn,
          name: 'default',
        })),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        formatters: {
          level: (level: string) => new Object({ level: level }),
        },
        prettyPrint:
          process.env.NODE_ENV !== 'production'
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
  ],
  controllers: [ AppController, AuthController ]
})
export class AppModule { }
