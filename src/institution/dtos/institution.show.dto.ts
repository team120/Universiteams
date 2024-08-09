import { Exclude, Expose, Type } from 'class-transformer';
import { FacilityShowDto } from '../../facility/dtos/facility.dto';
import { OmitType } from '@nestjs/swagger';

@Exclude()
export class InstitutionShowDto {
  @Expose()
  id: number;
  @Expose()
  name: string;
  @Expose()
  abbreviation: string;
  @Expose()
  web: string;
  @Expose()
  @Type(() => FacilityShowDto)
  facilities: FacilityShowDto[];
}

@Exclude()
export class InstitutionCreatedShowDto extends OmitType(InstitutionShowDto, [
  'facilities',
]) {}
