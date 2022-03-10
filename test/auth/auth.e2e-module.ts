import { Test } from '@nestjs/testing';
import { AuthModule } from '../../src/auth/auth.module';
import { commonImportsArray } from '../utils/common-imports.e2e';

export const createAuthTestModule = () => {
  return Test.createTestingModule({
    imports: [...commonImportsArray, AuthModule],
  });
};
