import { Exclude, Expose } from 'class-transformer';
import { UserShowDto, UserSimpleShowDto } from '../../user/dtos/user.show.dto';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';
import { RequestState } from '../enrollment.entity';

@Exclude()
export class EnrollmentInvitationShowDto {
  @ExposeType(Number)
  id: number;
  @Expose()
  requestState: RequestState;
  // The invitation message, written by the admin or leader
  @Expose()
  adminMessage: string;
  // The invited user's answer, if they declined with a message
  @Expose()
  requesterMessage: string;
  @ExposeType(Date)
  creationDate: Date;
  @ExposeType(UserShowDto)
  user: UserShowDto;
  @ExposeType(UserSimpleShowDto)
  sender: UserSimpleShowDto;
}
