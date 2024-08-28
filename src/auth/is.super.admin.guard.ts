import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Unauthorized } from '../utils/exceptions/exceptions';
import { RequestWithUser } from '../utils/request-with-user';
import { UserSystemRole } from '../user/user.entity';
import { IsEmailVerified } from './is-email-verified.guard';
import { IsAuthGuard } from './is-auth.guard';

@Injectable()
class IsSuperAdminRole implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: RequestWithUser = context.switchToHttp().getRequest();
    const currentUser = request.currentUser;
    if (currentUser.systemRole !== UserSystemRole.SUPER_ADMIN)
      throw new Unauthorized(
        `Current user#${currentUser.id} is not SUPER_ADMIN`,
      );
    return true;
  }
}

export const IsSuperAdminGuard = [
  IsAuthGuard,
  IsEmailVerified,
  IsSuperAdminRole,
];
