import { Repository, SelectQueryBuilder } from 'typeorm';

export class EntityQueryCreator<T> {
  constructor(private repository: Repository<T>) {}

  initialQuery(): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(
      this.repository.metadata.targetName.toLowerCase(),
    );
  }
}
