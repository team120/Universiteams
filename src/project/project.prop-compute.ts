import { Inject, Injectable } from '@nestjs/common';
import { isBefore } from 'date-fns';
import {
  CURRENT_DATE_SERVICE,
  ICurrentDateService,
} from '../utils/current-date';
import { Project } from './project.entity';

@Injectable()
export class ProjectPropCompute {
  constructor(
    @Inject(CURRENT_DATE_SERVICE)
    private readonly currentDate: ICurrentDateService,
  ) {}

  addIsDown(p: Project) {
    if (!p) return undefined;

    return { ...p, isDown: this.computeIsDown(p) };
  }

  private computeIsDown(p: Project): boolean {
    if (!p.endDate) return false;

    const now = new Date(this.currentDate.get());
    const endingDate = new Date(p.endDate);
    return isBefore(endingDate, now);
  }
}
