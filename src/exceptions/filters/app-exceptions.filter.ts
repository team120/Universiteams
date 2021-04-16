import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { AppLogger } from 'src/logger/app-logger';

@Catch()
export class AppExceptionsFilter extends BaseExceptionFilter {
  constructor(private logger: AppLogger) {
    super();
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getResponse();

    this.logger.error(exception.message, exception.stack, request.path);

    super.catch(exception, host);
  }
}
