import { Test } from '@nestjs/testing';
import { ProjectModule } from '../../src/project/project.module';
import { CURRENT_DATE_SERVICE } from '../../src/utils/current-date';
import { commonImportsArray } from '../utils/common-imports.e2e';
import { CurrentDateE2EMock } from '../utils/current-date.e2e-mock';

export const createProjectTestingApp = async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [...commonImportsArray, ProjectModule],
  })
    .overrideProvider(CURRENT_DATE_SERVICE)
    .useValue(new CurrentDateE2EMock())
    .compile();

  return moduleFixture.createNestApplication();
};
