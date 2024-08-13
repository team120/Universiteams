import { Exclude, Expose } from 'class-transformer';
import { ProjectType } from '../project.entity';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';
import { RequestState } from '../../enrollment/enrollment.entity';
import { IsOptional } from 'class-validator';

@Exclude()
export class ProjectShowCreatedDto {
  @ExposeType(Number)
  id: number;
  @Expose()
  name: string;
  @Expose()
  type: ProjectType;
  @Expose()
  language: 'spanish' | 'english';
  @Expose()
  @IsOptional()
  description?: string;
  @Expose()
  creationDate: string;
  @Expose()
  @IsOptional()
  endDate?: string;
  @Expose()
  @IsOptional()
  web?: string;
  @Expose()
  @IsOptional()
  requestState?: RequestState;
  @Expose()
  requesterMessage?: string;
}
