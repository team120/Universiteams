import { HttpException, HttpStatus } from '@nestjs/common';

export const POSTGRES_FK_CONSTRAINT_ERROR = '23503';

export class DbException extends HttpException {
  constructor(messageToLog?: string, stack?: string) {
    super('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    this.message = messageToLog;
    this.stack = stack;
  }
}

export class NotFound extends HttpException {
  constructor(validationMessage: string, messageToLog?: string) {
    super(validationMessage, HttpStatus.NOT_FOUND);
    this.message = messageToLog ?? validationMessage;
  }
}

export class Unauthorized extends HttpException {
  constructor(messageToLog?: string) {
    super('Unauthorized', HttpStatus.UNAUTHORIZED);
    this.message = messageToLog;
  }
}

export class BadRequest extends HttpException {
  constructor(validationMessage: string, messageToLog?: string) {
    super(validationMessage, HttpStatus.BAD_REQUEST);
    this.message = messageToLog ?? validationMessage;
  }
}
export class FKConstraintException extends HttpException {
  constructor(messageToLog: string) {
    super(messageToLog, HttpStatus.BAD_REQUEST);
    this.message = messageToLog;
  }
}
