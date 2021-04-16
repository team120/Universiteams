import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'src/logger/logger.module';
import { AppExceptionsFilter } from './filters/app-exceptions.filter';

@Module({
  imports: [LoggerModule],
  providers: [{ provide: APP_FILTER, useClass: AppExceptionsFilter }],
})
export class ExceptionsModule {}
