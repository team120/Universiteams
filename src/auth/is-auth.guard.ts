import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { IsAuthService } from './is-auth.service';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class IsAuthGuard implements CanActivate {
  constructor(
    private readonly isAuthService: IsAuthService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IsAuthGuard.name);
  }

  async canActivate(context: ExecutionContext) {
    const httpContext = context.switchToHttp();

    try {
      await this.isAuthService.setCurrentUser(httpContext);
    } catch (error) {
      this.logger.debug(error);
      throw error;
    }

    return true;
  }
}
