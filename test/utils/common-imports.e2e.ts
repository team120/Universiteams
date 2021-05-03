import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { ExceptionsModule } from '../../src/utils/exceptions/exceptions.module';
import { SerializationModule } from '../../src/utils/serialization/serialization.module';
import { getConnectionOptions } from 'typeorm';

export const commonImportsArray = [
  TypeOrmModule.forRootAsync({
    useFactory: async () =>
      await getConnectionOptions('test').then((connection) => ({
        ...connection,
        name: 'default',
      })),
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
