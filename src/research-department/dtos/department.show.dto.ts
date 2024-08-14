import { OmitType } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { FacilityShowDto } from '../../facility/dtos/facility.show.dto';
import { ProjectSingleDto } from '../../project/dtos/project.show.dto';

@Exclude()
export class ResearchDepartmentShowDto {
  @Expose()
  id: number;
  @Expose()
  name: string;
  @Expose()
  abbreviation: string;
  @Expose()
  web?: string;
  @Expose()
  @Type(() => FacilityShowDto)
  facility: FacilityShowDto;
  @Expose()
  @Type(() => ProjectSingleDto)
  projects: ProjectSingleDto[];
}
@Exclude()
export class DepartmentCreatedShowDto extends OmitType(
  ResearchDepartmentShowDto,
  ['projects'],
) {}

@Exclude()
export class DepartmentSimpleShowDto extends OmitType(
  ResearchDepartmentShowDto,
  ['projects', 'facility'],
) {}
