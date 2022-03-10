import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Unauthorized } from '../utils/exceptions/exceptions';
import { RequestWithUser } from '../utils/request-with-user';
import { IsAuthGuard } from './is-auth.guard';

@Injectable()
class IsEmailVerified implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: RequestWithUser = context.switchToHttp().getRequest();
    const currentUser = request.currentUser;

    if (!currentUser)
      throw new Unauthorized("Current user wasn't attached to request");

    if (!currentUser.isEmailVerified)
      throw new Unauthorized(
        `Current user#${currentUser.id} hasn't verified its email`,
      );

    return true;
  }
}

export const IsEmailVerifiedGuard = [IsAuthGuard, IsEmailVerified];
