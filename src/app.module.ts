import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthController } from './auth/auth.controller';
import { InstitutionController } from './institution/institution.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from './project/project.module';
import { UserModule } from './user/user.module';
import { ExceptionsModule } from './exceptions/exceptions.module';
import { LoggerModule } from 'nestjs-pino';
import { SerializationModule } from './serialization/serialization.module';
import { getConnectionOptions } from 'typeorm';
import { InstitutionService } from './institution/institution.service';
import { InstitutionModule } from './institution/institution.module';

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
    ProjectModule,
    UserModule,
    ExceptionsModule,
    SerializationModule,
    InstitutionModule,
  ],
  controllers: [AppController, AuthController],
})
export class AppModule {}
