import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { PinoLogger } from 'nestjs-pino';

@Catch()
export class AppExceptionsFilter extends BaseExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    super();
    this.logger.setContext(AppExceptionsFilter.name);
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    this.logger.error(exception, exception.message);
    super.catch(exception, host);
  }
}
