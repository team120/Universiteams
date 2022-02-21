import { Exclude, Expose } from 'class-transformer';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';

@Exclude()
export class TokenPayload {
  @ExposeType(Number)
  id: number;
  @Expose()
  user: string;
  @Expose()
  email: string;
}

@Exclude()
export class TokenDecoded extends TokenPayload {
  @ExposeType(Number)
  iat: number;
  @ExposeType(Number)
  exp: number;
}
