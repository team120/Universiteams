import { HttpException, HttpStatus } from '@nestjs/common';

export class DbException extends HttpException {
  constructor() {
    super('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    this.name = 'Database error';
  }
}
