import { Exclude } from 'class-transformer';
import { IsOptional, IsNumber, Min } from 'class-validator';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';

@Exclude()
export class InterestFindDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ExposeType(Number)
  offset?: number;
  @IsOptional()
  @IsNumber()
  @Min(1)
  @ExposeType(Number)
  limit?: number;
}
