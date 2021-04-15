import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ParseOptionalBoolean } from 'src/parse-optional-boolean.decorator';
import { ProjectType } from '../project.entity';

@Exclude()
export class ProjectFindDto {
  @Expose()
  generalSearch: string;
  @Expose()
  type: ProjectType;
  @Expose()
  @ParseOptionalBoolean()
  isDown: boolean;
  @Expose()
  departmentId: number;
  @Expose()
  universityId: number;
  @Expose()
  userId: number;
  @Expose()
  @Type(() => Date)
  dateFrom: Date;
  @Expose()
  sortBy: string;
  @Expose()
  @ParseOptionalBoolean()
  inAscendingOrder: boolean;
}
