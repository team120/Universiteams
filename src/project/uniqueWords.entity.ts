import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ materialized: true, synchronize: false })
export class UniqueWords {
  @ViewColumn()
  word: string;
}
