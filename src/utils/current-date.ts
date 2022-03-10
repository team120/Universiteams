import { formatISO } from 'date-fns';

export const CURRENT_DATE_SERVICE = 'CURRENT_DATE_SERVICE';

export interface ICurrentDateService {
  get(): string;
}

export class CurrentDateService implements ICurrentDateService {
  constructor(private currentDate?: string) {}

  get(): string {
    // currentDate if provided, should match ISO 8601 format
    if (
      this.currentDate &&
      !this.currentDate.match(
        /^([0-9]{4})-?(1[0-2]|0[1-9])-?(3[01]|0[1-9]|[12][0-9])$/gm,
      )
    )
      throw new Error("currentDate doesn't match ISO 8601 format");

    const now = this.currentDate ? new Date(this.currentDate) : new Date();
    return formatISO(now, { representation: 'date' });
  }
}
