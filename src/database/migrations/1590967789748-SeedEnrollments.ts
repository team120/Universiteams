import { MigrationInterface, getRepository } from 'typeorm';
import { NotImplementedException } from '@nestjs/common';

import { Enrollment } from '../../enrollment/enrolment.entity';
import { projectsSeed } from './1590967789745-SeedProjects';
import { usersSeed } from './1590967789746-SeedUsers';

export const enrollmentsSeed = {
  utnFrroIsiGeolocationIotJuanRizzo: getRepository(Enrollment).create({
    user: usersSeed.juanRizzo,
    project: projectsSeed.utnFrroIsiGeolocationIot,
  }),
  utnFrroIsiGeolocationIotCarlosVilla: getRepository(Enrollment).create({
    user: usersSeed.carlosVilla,
    project: projectsSeed.utnFrroIsiGeolocationIot,
  }),
  utnFrroIsiUniversiteamsCarlosVilla: getRepository(Enrollment).create({
    user: usersSeed.carlosVilla,
    project: projectsSeed.utnFrroIsiUniversiteams,
  }),
  utnFrroIsiUniversiteamsMarcosSanchez: getRepository(Enrollment).create({
    user: usersSeed.marcosSanchez,
    project: projectsSeed.utnFrroIsiUniversiteams,
  }),
};

export class SeedDb1590967789743 implements MigrationInterface {
  public async up(): Promise<void> {
    await getRepository(Enrollment).save(Object.values(enrollmentsSeed));
  }

  public async down(): Promise<void> {
    throw new NotImplementedException();
  }
}
