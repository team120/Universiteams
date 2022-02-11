import { ICurrentDateService } from '../../src/utils/current-date';

export class CurrentDateE2EMock implements ICurrentDateService {
  get(): string {
    return '2022-01-01';
  }
}
