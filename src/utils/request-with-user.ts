import { Request } from 'express';
import { EmbeddedUserInResponse } from '../auth/dtos/logged-user.show.dto';

export interface RequestWithUser extends Request {
  currentUser: EmbeddedUserInResponse;
}
