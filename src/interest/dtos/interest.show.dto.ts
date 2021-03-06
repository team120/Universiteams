import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class InterestShowDto {
  @Expose()
  id: number;
  @Expose()
  name: string;
}
