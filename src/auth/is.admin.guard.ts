import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Unauthorized } from '../utils/exceptions/exceptions';
import { RequestWithUser } from '../utils/request-with-user';
import { UserSystemRole } from '../user/user.entity';
import { IsEmailVerified } from './is-email-verified.guard';
import { IsAuthGuard } from './is-auth.guard';

@Injectable()
class IsAdminRole implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: RequestWithUser = context.switchToHttp().getRequest();
    const currentUser = request.currentUser;
    // User attached to Req and emailVerified is done under IsEmailVerifiedGuard
    if (currentUser.systemRole != UserSystemRole.ADMIN)
      throw new Unauthorized(`Current user#${currentUser.id} is not an ADMIN`);
    return true;
  }
}

export const IsAdminGuard = [IsAuthGuard, IsEmailVerified, IsAdminRole];
