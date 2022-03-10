import { OmitType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';

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
}

@Exclude()
export class CurrentUserWithoutTokens extends OmitType(CurrentUserDto, [
  'accessToken',
  'refreshToken',
]) {}
