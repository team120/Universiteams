import { HttpException, HttpStatus } from '@nestjs/common';

export class DbException extends HttpException {
  constructor(message?: string, stack?: string) {
    super('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    this.message = message;
    this.stack = stack;
  }
}
