import { Request } from 'express';
import { CurrentUserWithoutTokens } from '../auth/dtos/current-user.dto';

export interface RequestWithUser extends Request {
  currentUser: CurrentUserWithoutTokens;
}
