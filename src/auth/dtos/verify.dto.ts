import { Exclude, Expose } from 'class-transformer';
import { IsJWT } from 'class-validator';

@Exclude()
export class VerifyDto {
  @IsJWT()
  @Expose()
  verificationToken: string;
}
