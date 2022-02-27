import { OmitType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

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
