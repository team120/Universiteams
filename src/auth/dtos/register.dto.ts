import { Exclude, Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, Length } from 'class-validator';
import { IsValidPassword } from '../password.validator';
import { CurrentUserDto } from './current-user.dto';

@Exclude()
export class RegisterDto {
  @IsNotEmpty()
  @IsEmail()
  @Expose()
  email: string;

  @IsNotEmpty()
  @Length(2)
  @Expose()
  firstName: string;

  @IsNotEmpty()
  @Length(2)
  @Expose()
  lastName: string;

  @IsNotEmpty()
  @Length(8)
  @IsValidPassword()
  @Expose()
  password: string;
}

export interface RegisteredUser {
  user: CurrentUserDto;
  emailError?: string;
}
