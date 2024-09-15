import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ materialized: true, synchronize: false })
export class UserSearchIndex {
  @ViewColumn()
  id: number;
  @ViewColumn()
  document_with_weights_user: any;
}
