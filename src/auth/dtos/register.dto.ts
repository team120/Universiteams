import { Exclude, Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { IsValidPassword } from '../password.validator';

@Exclude()
export class RegisterDto {
  @IsNotEmpty()
  @IsEmail()
  @Expose()
  email: string;

  @IsNotEmpty()
  @MinLength(2)
  @Expose()
  firstName: string;

  @IsNotEmpty()
  @MinLength(2)
  @Expose()
  lastName: string;

  @IsNotEmpty()
  @MinLength(8)
  @IsValidPassword()
  @Expose()
  password: string;
}
