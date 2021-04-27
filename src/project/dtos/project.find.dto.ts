import { OmitType, PickType } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { ParseOptionalBoolean } from '../../utils/decorators/parse-optional-boolean.decorator';
import { ProjectType } from '../project.entity';

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
  @Expose()
  @Type(() => Date)
  dateFrom?: Date;
  @Expose()
  sortBy?: string;
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
