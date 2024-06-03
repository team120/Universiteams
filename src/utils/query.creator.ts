import { Repository, SelectQueryBuilder } from 'typeorm';

export class EntityQueryCreator<T> {
  constructor(private repository: Repository<T>) {}

  initialQuery(): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(
      // Toma por ejemplo el nombre de la clase Project, luego pasa como parametro 'project'
      this.repository.metadata.targetName.toLowerCase(),
    );
  }
}
