import { Exclude, Expose } from 'class-transformer';
import { UserShowDto } from '../../user/dtos/user.show.dto';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';

@Exclude()
export class EnrollmentRequestShowDto {
  @ExposeType(Number)
  id: number;
  @Expose()
  requesterMessage: string;
  @ExposeType(Date)
  creationDate: Date;
  @ExposeType(UserShowDto)
  user: UserShowDto;
}
