import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ materialized: true, synchronize: false })
export class ProjectSearchIndex {
  @ViewColumn()
  id: number;
  @ViewColumn()
  document_with_weights: any;
}
