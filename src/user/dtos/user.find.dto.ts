import { OmitType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { ExposeType } from 'src/utils/decorators/expose-type.decorator';

@Exclude()
export class UserFindDto {
  @Expose()
  firstName: string;
  @Expose()
  lastName: string;
  @Expose()
  email: string;
  @IsOptional()
  @IsNumber({}, { each: true })
  @ExposeType(Number)
  interestIds?: number[];
}

export class UserFilters extends OmitType(UserFindDto, [
  'firstName',
  'lastName',
  'email',
]) {}
