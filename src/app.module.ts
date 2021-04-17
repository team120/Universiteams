import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { UniversityController } from './university/university.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from './project/project.module';
import { UserModule } from './user/user.module';
import { ExceptionsModule } from './exceptions/exceptions.module';
import { LoggerModule } from 'nestjs-pino';
import { SerializationModule } from './serialization/serialization.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
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
  ],
  controllers: [AppController, AuthController, UniversityController],
  providers: [AppService],
})
export class AppModule {}
