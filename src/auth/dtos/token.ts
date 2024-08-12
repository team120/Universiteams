import { Exclude, Expose } from 'class-transformer';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';
import { OmitType } from '@nestjs/swagger';
import { UserSystemRole } from '../../user/user.entity';

@Exclude()
export class GeneralTokenPayload {
  @ExposeType(Number)
  id: number;
  @Expose()
  user: string;
  @Expose()
  email: string;
  @ExposeType(Boolean)
  isEmailVerified: boolean;
  @Expose()
  systemRole: UserSystemRole;
}

@Exclude()
export class EmailTokenPayload extends OmitType(GeneralTokenPayload, [
  'isEmailVerified',
  'systemRole',
]) {
  @Expose()
  identityHash: string;
}

@Exclude()
export class GeneralTokenDecoded extends GeneralTokenPayload {
  @ExposeType(Number)
  iat: number;
  @ExposeType(Number)
  exp: number;
}
