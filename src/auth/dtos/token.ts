import { Exclude, Expose } from 'class-transformer';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';

@Exclude()
export class GeneralTokenPayload {
  @ExposeType(Number)
  id: number;
  @Expose()
  user: string;
  @Expose()
  email: string;
}

@Exclude()
export class EmailTokenPayload {
  @Expose()
  identityHash: string;
  @Expose()
  email: string;
}

@Exclude()
export class GeneralTokenDecoded extends GeneralTokenPayload {
  @ExposeType(Number)
  iat: number;
  @ExposeType(Number)
  exp: number;
}
