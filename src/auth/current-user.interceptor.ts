import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { IsAuthService } from './is-auth.service';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class SetCurrentUserInterceptor implements NestInterceptor {
  constructor(
    private readonly isAuthService: IsAuthService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SetCurrentUserInterceptor.name);
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const httpContext = context.switchToHttp();

    try {
      await this.isAuthService.setCurrentUser(httpContext);
    } catch (error) {
      this.logger.debug(error);
    }

    return next.handle();
  }
}
