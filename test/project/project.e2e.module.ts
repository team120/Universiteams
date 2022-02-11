import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ProjectModule } from '../../src/project/project.module';
import { CURRENT_DATE_SERVICE } from '../../src/utils/current-date';
import { commonImportsArray } from '../utils/common-imports.e2e';
import { CurrentDateE2EMock } from '../utils/current-date.e2e-mock';

@Module({
  imports: [ProjectModule, ...commonImportsArray],
})
class ProjectE2EModule {}

export const createProjectTestingApp = async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [ProjectE2EModule],
  })
    .overrideProvider(CURRENT_DATE_SERVICE)
    .useValue(new CurrentDateE2EMock())
    .compile();

  return moduleFixture.createNestApplication();
};
