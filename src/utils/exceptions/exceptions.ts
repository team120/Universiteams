import { HttpException, HttpStatus } from '@nestjs/common';

export class DbException extends HttpException {
  constructor(messageToLog?: string, stack?: string) {
    super('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    this.message = messageToLog;
    this.stack = stack;
  }
}

export class Unauthorized extends HttpException {
  constructor(messageToLog?: string) {
    super('Unauthorized', HttpStatus.UNAUTHORIZED);
    this.message = messageToLog;
  }
}
