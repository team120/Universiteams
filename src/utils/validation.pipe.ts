import { ArgumentMetadata, Injectable, ValidationPipe } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AppValidationPipe extends ValidationPipe {
  constructor(private readonly logger: PinoLogger) {
    super({ transform: true });
    this.logger.setContext(AppValidationPipe.name);
  }

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    const result = await super.transform(value, metadata).catch((err) => {
      this.logger.debug(
        'Validation errors present => Exception filter will handle it',
      );
      throw err;
    });

    this.logger.debug(result, 'Transformed result');
    return result;
  }
}
