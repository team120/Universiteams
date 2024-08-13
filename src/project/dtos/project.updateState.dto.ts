import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { RequestState } from 'src/enrollment/enrollment.entity';

@Exclude()
export class ProjectUpdateStateDto {
  @Expose()
  @IsNotEmpty()
  requestState: RequestState;
  @Expose()
  @IsNotEmpty()
  adminMessage: string;
}
