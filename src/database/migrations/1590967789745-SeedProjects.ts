import { MigrationInterface, getRepository } from 'typeorm';
import { NotImplementedException } from '@nestjs/common';

import { Project, ProjectType } from '../../project/project.entity';
import { interestsSeed } from './1590967789744-SeedInterests';
import { researchDepartmentsSeed } from './1590967789743-SeedInstitutions&Related';
import { enrollmentsSeed } from './1590967789748-SeedEnrollments';

export const projectsSeed = {
  utnFrroIsiGeolocationIot: getRepository(Project).create({
    name: 'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
    type: ProjectType.Formal,
    researchDepartment: researchDepartmentsSeed.utnFrroIsi,
    creationDate: '2020-03-16T17:13:02.000Z',
    interests: [interestsSeed.arduino, interestsSeed.itSecurity],
  }),
  utnFrroIsiUniversiteams: getRepository(Project).create({
    name: 'Universiteams',
    type: ProjectType.Informal,
    creationDate: '2021-03-16T17:13:02.000Z',
    researchDepartment: researchDepartmentsSeed.utnFrroIsi,
    interests: [interestsSeed.dataScience, interestsSeed.cryptoCurrency],
  }),
};

export class SeedDb1590967789743 implements MigrationInterface {
  public async up(): Promise<void> {
    await getRepository(Project).save(Object.values(projectsSeed));
  }

  public async down(): Promise<void> {
    throw new NotImplementedException();
  }
}
