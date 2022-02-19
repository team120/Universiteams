import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class LoggedUserDto {
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
