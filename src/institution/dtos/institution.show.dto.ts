import { Exclude, Expose, Type } from 'class-transformer';
import { FacilityShowDto } from '../../facility/dtos/facility.dto';

@Exclude()
export class InstitutionShowDto {
  @Expose()
  id: number;
  @Expose()
  name: string;
  @Expose()
  abbreviation: string;

  @Expose()
  @Type(() => FacilityShowDto)
  facilities: FacilityShowDto[];
}
