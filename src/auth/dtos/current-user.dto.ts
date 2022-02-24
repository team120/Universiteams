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
  @ExposeType(Number)
  accessTokenExpiration: number;
  @Expose()
  accessToken: string;
  @ExposeType(Number)
  refreshTokenExpiration: number;
  @Expose()
  refreshToken: string;
}

@Exclude()
export class CurrentUserWithoutTokens extends OmitType(CurrentUserDto, [
  'accessToken',
  'accessTokenExpiration',
  'refreshToken',
  'refreshTokenExpiration',
]) {}
