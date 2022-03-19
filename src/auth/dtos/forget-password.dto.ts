import { Exclude, Expose } from 'class-transformer';
import { IsEmail, IsJWT, IsNotEmpty, MinLength } from 'class-validator';
import { IsValidPassword } from '../password.validator';

@Exclude()
export class ForgetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  @Expose()
  email: string;
}

@Exclude()
export class ResetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  @Expose()
  email: string;
  @IsNotEmpty()
  @MinLength(8)
  @IsValidPassword()
  @Expose()
  password: string;
  @IsJWT()
  @Expose()
  verificationToken: string;
}
