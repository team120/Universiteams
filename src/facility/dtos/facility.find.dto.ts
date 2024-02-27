import { PickType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';


@Exclude()
export class FacilityFindDto {
  @IsOptional()
  @IsNumber()
  @ExposeType(Number)
  institutionId?: number;
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

@Exclude()
export class PaginationAttributes extends PickType(FacilityFindDto, [
  'limit',
  'offset',
]) {}
