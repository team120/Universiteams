import { ICurrentDateService } from './current-date';

export class CurrentDateServiceMock implements ICurrentDateService {
  constructor(private date: string) {}

  get(): string {
    return this.date;
  }
  set(date: string) {
    this.date = date;
  }
}
