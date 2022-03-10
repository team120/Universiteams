import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { ExceptionsModule } from '../../src/utils/exceptions/exceptions.module';
import { SerializationModule } from '../../src/utils/serialization/serialization.module';

export const commonImportsArray = [
  TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      type: 'postgres',
      database: configService.get('POSTGRES_DB'),
      host: configService.get('POSTGRES_HOST'),
      port: configService.get('POSTGRES_PORT'),
      username: configService.get('POSTGRES_USER'),
      password: configService.get('POSTGRES_PASSWORD'),
      synchronize: true,
      logging: false,
      entities: ['src/**/*.entity.ts'],
      migrations: ['src/database/migrations/*.ts'],
      migrationsRun: false,
    }),
  }),
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
  LoggerModule.forRoot({
    pinoHttp: {
      level: 'error',
      formatters: {
        level: (level: string) => new Object({ level: level }),
      },
      prettyPrint: {
        colorize: true,
        levelFirst: true,
        translateTime: 'mm/dd/yyyy h:MM:ss TT Z',
      },
    },
  }),
  ExceptionsModule,
  SerializationModule,
];
