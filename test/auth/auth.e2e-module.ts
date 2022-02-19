import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthModule } from '../../src/auth/auth.module';
import { commonImportsArray } from '../utils/common-imports.e2e';

export const createAuthTestApp = async (): Promise<INestApplication> => {
  const moduleFixture = await Test.createTestingModule({
    imports: [...commonImportsArray, AuthModule],
  }).compile();

  return moduleFixture.createNestApplication();
};
