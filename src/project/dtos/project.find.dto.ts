import { OmitType, PickType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';
import { ParseOptionalBoolean } from '../../utils/decorators/parse-optional-boolean.decorator';
import { ProjectType } from '../project.entity';

export enum SortByProperty {
  name = 'name',
  researchDepartment = 'researchDepartment',
  facility = 'facility',
  creationDate = 'creationDate',
  type = 'type',
}

@Exclude()
export class ProjectFindDto {
  @Expose()
  generalSearch?: string;
  @Expose()
  type?: ProjectType;
  @Expose()
  @ParseOptionalBoolean()
  isDown?: boolean;
  @Expose()
  researchDepartmentId?: number;
  @Expose()
  institutionId?: number;
  @Expose()
  userId?: number;
  @ExposeType(Date)
  dateFrom?: Date;
  @Expose()
  sortBy?: SortByProperty;
  @Expose()
  @ParseOptionalBoolean()
  inAscendingOrder?: boolean;
}

const sortAttributes = ['sortBy', 'inAscendingOrder'] as const;

export class ProjectFilters extends OmitType(ProjectFindDto, sortAttributes) {}

export class ProjectSortAttributes extends PickType(
  ProjectFindDto,
  sortAttributes,
) {}
