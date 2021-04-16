import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { PinoLogger } from 'nestjs-pino';

@Catch()
export class AppExceptionsFilter extends BaseExceptionFilter {
  constructor(private logger: PinoLogger) {
    super();
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    this.logger.error(exception.stack, exception.message);
    super.catch(exception, host);
  }
}
