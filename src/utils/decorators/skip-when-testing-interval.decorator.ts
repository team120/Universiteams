import { Interval } from '@nestjs/schedule';

export const SkipWhenTestingInterval = (name: string, interval: number) =>
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  process.env.NODE_ENV === 'dev' ? () => {} : Interval(name, interval);
