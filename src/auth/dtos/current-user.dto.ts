import { OmitType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';
import { UserSystemRole } from '../../user/user.entity';
@Exclude()
export class CurrentUserDto {
  @Expose()
  id: number;
  @Expose()
  firstName: string;
  @Expose()
  lastName: string;
  @Expose()
  email: string;
  @ExposeType(Boolean)
  isEmailVerified: boolean;
  @Expose()
  accessToken: string;
  @Expose()
  refreshToken: string;
  @Expose()
  systemRole: UserSystemRole;
}

@Exclude()
export class CurrentUserWithoutTokens extends OmitType(CurrentUserDto, [
  'accessToken',
  'refreshToken',
]) {}
